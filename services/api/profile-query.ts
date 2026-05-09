// D1.3 — POST /profile/query
// Deno edge function for InsForge Subhosting.
// Fallback-LLM mode (authoritative): pull last 100 events for user, hand to
// InsForge AI gateway with a single chat completion. Nia is opt-in for demo seed.

declare const Deno: { env: { get(k: string): string | undefined } };

const BASE = Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('INSFORGE_SERVICE_KEY') ?? '';
const MODEL = Deno.env.get('LLM_MODEL') ?? 'openai/gpt-4o-mini';

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

function formatEvents(events: EventRow[]): string {
  return events.map((e) => {
    const ts = new Date(e.occurred_at).toISOString();
    const props = JSON.stringify(e.properties);
    return `- [${ts}] ${e.site_id}: ${e.event_type} ${props}`;
  }).join('\n');
}

async function llmAnswer(question: string, events: EventRow[]): Promise<string> {
  const sys =
    'You analyse a user\'s cross-site browsing events to answer a single question. ' +
    'Be concise. When you cite a fact, reference the event timestamp in ISO form. ' +
    'If the events are insufficient, say so plainly.';
  const user =
    `User events (most recent first):\n${formatEvents(events)}\n\n` +
    `Question: ${question}\n\n` +
    `Answer in 1–3 sentences.`;
  const r = await ifFetch('POST', `/api/ai/chat/completion`, {
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
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

  const events = await recentEvents(String(userHash));
  const answer = events.length === 0
    ? 'No events recorded for this user yet.'
    : await llmAnswer(String(question), events);

  return json({ answer, sources: events });
}
