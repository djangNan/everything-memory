// POST /functions/cohort-query
// Cohort-scoped natural-language query. Replaces the per-user /profile-query
// for the admin dashboard — no individual hashes are returned, only aggregate
// counts and synthesized answers.
//
// Body:
//   { apiKey: string,
//     filters: { region?: string, gender?: 'M'|'F', age_band?: string, interests?: string[] },
//     question: string,
//     limit_users?: number      // cohort size cap; default 50
//   }
//
// k-anonymity: cohorts smaller than MIN_COHORT_SIZE are rejected (returns 200
// with an explicit refusal message and zero sources). This is enforced server
// side regardless of the question.
//
// Sources: aggregate event sample across the cohort. We never echo user_hash
// values back, only the event_type / site_id / properties / occurred_at tuple.

declare const Deno: { env: { get(k: string): string | undefined } };

const BASE = Deno.env.get('INSFORGE_INTERNAL_URL') ?? Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('API_KEY') ?? '';
const MODEL = Deno.env.get('LLM_MODEL') ?? 'anthropic/claude-opus-4.5';
const NIA_KEY = Deno.env.get('NIA_API_KEY') ?? '';
const NIA = 'https://apigcp.trynia.ai/v2';

const MIN_COHORT_SIZE = 2;
const DEFAULT_LIMIT_USERS = 50;
const EVENTS_SAMPLE_PER_USER = 20;

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

type Filters = {
  region?: string;
  gender?: 'M' | 'F';
  age_band?: string;
  interests?: string[];
};

async function siteForApiKey(apiKey: string): Promise<{ site_id: string } | null> {
  const r = await ifFetch('GET', `/api/database/records/sites?api_key=eq.${encodeURIComponent(apiKey)}`);
  if (!r.ok) return null;
  const rows = (await r.json()) as Array<{ site_id: string }>;
  return rows[0] ?? null;
}

// Builds a PostgREST filter against users.demographics_json (jsonb).
// Uses ->> for scalar equality (region/gender/age_band) and ?| for any-of on
// the interests array. interests filter requires that every requested interest
// is present (uses ?& which means "contains all").
async function findCohort(filters: Filters, limit: number): Promise<string[]> {
  const params: string[] = [
    'select=user_hash',
    `limit=${limit}`,
    'order=created_at.desc',
  ];
  if (filters.region) {
    params.push(`demographics_json->>region=eq.${encodeURIComponent(filters.region)}`);
  }
  if (filters.gender) {
    params.push(`demographics_json->>gender=eq.${encodeURIComponent(filters.gender)}`);
  }
  if (filters.age_band) {
    params.push(`demographics_json->>age_band=eq.${encodeURIComponent(filters.age_band)}`);
  }
  if (filters.interests && filters.interests.length > 0) {
    // Each interest must be present in the demographics_json->'interests' array.
    // PostgREST cs (contains) operator on a jsonb path takes a JSON array literal.
    const arr = JSON.stringify(filters.interests.map((s) => s.toLowerCase()));
    params.push(`demographics_json->interests=cs.${encodeURIComponent(arr)}`);
  }
  // Always require demographics_json to be set (i.e. has been inferred at least once).
  params.push(`demographics_json=not.is.null`);

  const path = `/api/database/records/users?${params.join('&')}`;
  const r = await ifFetch('GET', path);
  if (!r.ok) return [];
  const rows = (await r.json()) as Array<{ user_hash: string }>;
  return rows.map((u) => u.user_hash);
}

async function eventsForCohort(userHashes: string[]): Promise<EventRow[]> {
  if (userHashes.length === 0) return [];
  // PostgREST `in.(...)` operator
  const inList = encodeURIComponent(`(${userHashes.join(',')})`);
  const path =
    `/api/database/records/events` +
    `?user_hash=in.${inList}` +
    `&select=event_type,site_id,properties,occurred_at` +
    `&order=occurred_at.desc&limit=${EVENTS_SAMPLE_PER_USER * userHashes.length}`;
  const r = await ifFetch('GET', path);
  if (!r.ok) return [];
  return (await r.json()) as EventRow[];
}

// Pull cohort-relevant context from Nia. Filters by user_hash on the client side
// because /v2/contexts/semantic-search has no native user filter — we encoded
// hashes into context content + metadata.
async function niaCohortSearch(userHashes: string[], question: string): Promise<{ events: EventRow[]; raw: number }> {
  if (!NIA_KEY || userHashes.length === 0) return { events: [], raw: 0 };
  try {
    const set = new Set(userHashes);
    const url = new URL(`${NIA}/contexts/semantic-search`);
    url.searchParams.set('q', question);
    url.searchParams.set('limit', '50');
    url.searchParams.set('include_highlights', 'false');
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${NIA_KEY}` } });
    if (!r.ok) return { events: [], raw: 0 };
    const j = (await r.json()) as { results?: any[] };
    const all = j.results ?? [];
    const mine = all
      .filter((x: any) => set.has(x?.metadata?.user_hash))
      .map(
        (x: any) =>
          ({
            event_type: String(x.metadata.event_type ?? ''),
            site_id: String(x.metadata.site_id ?? ''),
            properties:
              x.metadata.properties && typeof x.metadata.properties === 'object'
                ? x.metadata.properties
                : {},
            occurred_at: String(x.metadata.occurred_at ?? ''),
          }) as EventRow
      )
      .filter((e) => e.event_type && e.site_id && e.occurred_at);
    return { events: mine, raw: all.length };
  } catch (_) {
    return { events: [], raw: 0 };
  }
}

function dedupe(primary: EventRow[], secondary: EventRow[]): EventRow[] {
  const key = (e: EventRow) => `${e.occurred_at}|${e.site_id}|${e.event_type}|${JSON.stringify(e.properties)}`;
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

function describeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.region) parts.push(`region=${f.region}`);
  if (f.gender) parts.push(`gender=${f.gender}`);
  if (f.age_band) parts.push(`age_band=${f.age_band}`);
  if (f.interests && f.interests.length > 0) parts.push(`interests=[${f.interests.join(',')}]`);
  return parts.length === 0 ? 'all users' : parts.join(', ');
}

function formatEvents(events: EventRow[]): string {
  return events
    .slice(0, 80)
    .map((e) => `- [${new Date(e.occurred_at).toISOString()}] ${e.site_id}: ${e.event_type} ${JSON.stringify(e.properties)}`)
    .join('\n');
}

async function llmSynthesize(
  cohortDesc: string,
  cohortSize: number,
  niaEvents: EventRow[],
  allEvents: EventRow[],
  question: string
): Promise<string> {
  const sys =
    'You answer a single question about a COHORT of shoppers (not an individual). ' +
    'Talk about the group in aggregate ("most users", "the cohort"). ' +
    'Never identify or describe a single user. ' +
    'Cite the event timestamp in ISO form when you reference a fact.';
  const niaBlock =
    niaEvents.length > 0
      ? `Cohort events ranked by Nia for the question:\n${formatEvents(niaEvents)}\n\n`
      : '';
  const userMsg =
    `Cohort: ${cohortDesc} (${cohortSize} users)\n\n` +
    `${niaBlock}` +
    `Recent cohort events (chronological, most recent first):\n${formatEvents(allEvents)}\n\n` +
    `Question: ${question}\n\n` +
    `Answer in 1–3 sentences. Speak about the cohort as a group.`;
  const r = await ifFetch('POST', '/api/ai/chat/completion', {
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userMsg },
    ],
    maxTokens: 240,
    temperature: 0.3,
  });
  if (!r.ok) {
    const t = await r.text();
    return `(LLM unavailable: ${r.status} ${t.slice(0, 120)})`;
  }
  const j = (await r.json()) as { text?: string };
  return j.text?.trim() || '(empty response)';
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  const { apiKey, filters, question, limit_users } = body ?? {};
  if (!apiKey || !question) return json({ error: 'apiKey and question required' }, 400);

  const site = await siteForApiKey(String(apiKey));
  if (!site) return json({ error: 'invalid apiKey' }, 401);

  const cleanedFilters: Filters = {};
  if (filters && typeof filters === 'object') {
    if (typeof filters.region === 'string' && filters.region) cleanedFilters.region = filters.region;
    if (filters.gender === 'M' || filters.gender === 'F') cleanedFilters.gender = filters.gender;
    if (typeof filters.age_band === 'string' && filters.age_band) cleanedFilters.age_band = filters.age_band;
    if (Array.isArray(filters.interests)) {
      cleanedFilters.interests = filters.interests
        .filter((x: unknown) => typeof x === 'string' && x.length > 0)
        .map((x: string) => x.toLowerCase())
        .slice(0, 5);
    }
  }

  const cap = Math.min(200, Math.max(1, Number(limit_users) || DEFAULT_LIMIT_USERS));
  const cohortHashes = await findCohort(cleanedFilters, cap);
  const cohortSize = cohortHashes.length;
  const cohortDesc = describeFilters(cleanedFilters);

  if (cohortSize < MIN_COHORT_SIZE) {
    return json({
      answer: `Cohort too small (${cohortSize} users) — minimum is ${MIN_COHORT_SIZE} for privacy. Loosen the filters.`,
      sources: [],
      cohort: { size: cohortSize, filters: cleanedFilters, min_size: MIN_COHORT_SIZE, k_anonymous: false },
      via: 'refused',
    });
  }

  const [nia, dbEvents] = await Promise.all([
    niaCohortSearch(cohortHashes, String(question)),
    eventsForCohort(cohortHashes),
  ]);

  if (dbEvents.length === 0 && nia.events.length === 0) {
    return json({
      answer: `Cohort matched ${cohortSize} users but they have no events recorded yet.`,
      sources: [],
      cohort: { size: cohortSize, filters: cleanedFilters, min_size: MIN_COHORT_SIZE, k_anonymous: true },
      via: 'empty',
    });
  }

  const sources = dedupe(nia.events, dbEvents).slice(0, 50);
  const answer = await llmSynthesize(cohortDesc, cohortSize, nia.events, sources, String(question));

  return json({
    answer,
    sources, // event-level only — never user_hash
    cohort: { size: cohortSize, filters: cleanedFilters, min_size: MIN_COHORT_SIZE, k_anonymous: true },
    via: nia.events.length > 0 ? 'nia' : 'fallback',
    nia: { used: nia.events.length > 0, hits: nia.events.length, raw: nia.raw },
  });
}
