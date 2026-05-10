// D1.3 — POST /profile-query
// Deno edge function for InsForge Subhosting.
//
// Two-phase synthesis:
//   1. Nia Context Sharing semantic search (vector + BM25 hybrid) over saved
//      events scoped to this user_hash. Result: relevance-ranked event subset.
//   2. InsForge AI gateway (openai/gpt-4o-mini) writes the final NL answer
//      using the Nia-ranked subset as primary context, falling back to a
//      latest-100 DB scan if Nia is empty / down. The response surfaces a
//      `via` field so the UI can show whether Nia carried this turn.

declare const Deno: { env: { get(k: string): string | undefined } };

const BASE = Deno.env.get('INSFORGE_INTERNAL_URL') ?? Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('API_KEY') ?? '';
const MODEL = Deno.env.get('LLM_MODEL') ?? 'openai/gpt-4o-mini';
const NIA_KEY = Deno.env.get('NIA_API_KEY') ?? '';
const NIA = 'https://apigcp.trynia.ai/v2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

async function ifFetch(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

type EventRow = {
  event_type: string;
  site_id: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

async function siteForApiKey(apiKey: string): Promise<{ site_id: string } | null> {
  const r = await ifFetch('GET', `/api/database/records/sites?api_key=eq.${encodeURIComponent(apiKey)}`);
  if (!r.ok) return null;
  const rows = await r.json() as Array<{ site_id: string }>;
  return rows[0] ?? null;
}

async function recentEvents(userHash: string): Promise<EventRow[]> {
  const path =
    `/api/database/records/events` +
    `?user_hash=eq.${encodeURIComponent(userHash)}` +
    `&select=event_type,site_id,properties,occurred_at` +
    `&order=occurred_at.desc&limit=100`;
  const r = await ifFetch('GET', path);
  if (!r.ok) return [];
  return await r.json() as EventRow[];
}

// Nia Context Sharing semantic-search. Filters results by user_hash because
// /v2/contexts/semantic-search has no native user filter — we encode user_hash
// in both content (for ranking) and metadata (for strict filter).
async function niaSearch(userHash: string, question: string): Promise<{ events: EventRow[]; raw: number }> {
  if (!NIA_KEY) return { events: [], raw: 0 };
  try {
    const url = new URL(`${NIA}/contexts/semantic-search`);
    // Bias the query toward this user — semantic search will rank events whose
    // saved content includes the same hash higher.
    url.searchParams.set('q', `${question} ${userHash}`);
    url.searchParams.set('limit', '20');
    url.searchParams.set('include_highlights', 'false');
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${NIA_KEY}` },
    });
    if (!r.ok) return { events: [], raw: 0 };
    const j = await r.json() as { results?: any[] };
    const all = j.results ?? [];
    const mine = all
      .filter((x: any) => x?.metadata?.user_hash === userHash)
      .map((x: any) => ({
        event_type: String(x.metadata.event_type ?? ''),
        site_id: String(x.metadata.site_id ?? ''),
        properties: (x.metadata.properties && typeof x.metadata.properties === 'object') ? x.metadata.properties : {},
        occurred_at: String(x.metadata.occurred_at ?? ''),
      } as EventRow))
      .filter((e) => e.event_type && e.site_id && e.occurred_at);
    return { events: mine, raw: all.length };
  } catch (_) {
    return { events: [], raw: 0 };
  }
}

function dedupeEvents(primary: EventRow[], secondary: EventRow[]): EventRow[] {
  const key = (e: EventRow) => `${e.occurred_at}|${e.site_id}|${e.event_type}`;
  const seen = new Set<string>();
  const out: EventRow[] = [];
  for (const e of [...primary, ...secondary]) {
    const k = key(e);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

function formatEvents(events: EventRow[]): string {
  return events.map((e) => {
    const ts = new Date(e.occurred_at).toISOString();
    const props = JSON.stringify(e.properties);
    return `- [${ts}] ${e.site_id}: ${e.event_type} ${props}`;
  }).join('\n');
}

async function llmAnswer(question: string, niaEvents: EventRow[], allEvents: EventRow[]): Promise<string> {
  const sys =
    'You analyse a user\'s cross-site browsing events to answer a single question. ' +
    'Be concise. Cite the event timestamp in ISO form when you reference a fact. ' +
    'If the events are insufficient, say so plainly.';
  const niaBlock = niaEvents.length > 0
    ? `Nia-relevant events (semantically ranked for the question):\n${formatEvents(niaEvents)}\n\n`
    : '';
  const userMsg =
    `${niaBlock}` +
    `All recent events (newest first):\n${formatEvents(allEvents)}\n\n` +
    `Question: ${question}\n\n` +
    `Answer in 1–3 sentences. Prefer facts that appear in both lists.`;
  const r = await ifFetch('POST', `/api/ai/chat/completion`, {
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userMsg },
    ],
    maxTokens: 220,
    temperature: 0.3,
  });
  if (!r.ok) {
    const t = await r.text();
    return `(LLM unavailable: ${r.status} ${t.slice(0, 120)})`;
  }
  const j = await r.json() as { text?: string };
  return j.text?.trim() || '(empty response)';
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

  const { apiKey, userHash, question } = body ?? {};
  if (!apiKey || !userHash || !question) {
    return json({ error: 'apiKey, userHash, question required' }, 400);
  }

  const site = await siteForApiKey(String(apiKey));
  if (!site) return json({ error: 'invalid apiKey' }, 401);

  // Run Nia search and DB fetch in parallel; both are independent of each other.
  const [nia, dbEvents] = await Promise.all([
    niaSearch(String(userHash), String(question)),
    recentEvents(String(userHash)),
  ]);

  if (dbEvents.length === 0 && nia.events.length === 0) {
    return json({ answer: 'No events recorded for this user yet.', sources: [], via: 'empty', nia: { used: false, hits: 0 } });
  }

  // Sources: Nia-ranked first (relevance), then chronological DB events deduped.
  const sources = dedupeEvents(nia.events, dbEvents);
  const answer = await llmAnswer(String(question), nia.events, sources);

  return json({
    answer,
    sources,
    via: nia.events.length > 0 ? 'nia' : 'fallback',
    nia: { used: nia.events.length > 0, hits: nia.events.length, raw: nia.raw },
  });
}
