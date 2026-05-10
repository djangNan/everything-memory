// POST /functions/infer-demographics
// Admin-triggered batch job: for each user with >= MIN_EVENTS, ask the LLM to
// infer demographics (region / gender / age_band / interests) from their event
// log, and persist the result into users.demographics_json.
//
// Auth: caller must pass adminToken in body matching API_KEY (same Subhosting
// admin key the function already has). This makes the endpoint admin-only
// without inventing a new credential — only the dashboard owner has API_KEY.
//
// Idempotent: skips users whose existing demographics_json was inferred within
// the last STALE_HOURS hours, unless force=true.

declare const Deno: { env: { get(k: string): string | undefined } };

const BASE = Deno.env.get('INSFORGE_INTERNAL_URL') ?? Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('API_KEY') ?? '';
const MODEL = Deno.env.get('LLM_MODEL') ?? 'openai/gpt-4o-mini';

const MIN_EVENTS = 1;
const STALE_HOURS = 6;

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

type Demographics = {
  region: string;
  gender: 'M' | 'F' | 'unknown';
  age_band: '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'unknown';
  interests: string[];
  confidence: number;
  inferred_at: string;
  model: string;
  event_count: number;
};

const SYS = `You infer coarse demographic attributes about a shopper from their cross-site browsing events.
Output JSON only — no prose, no markdown fences. Schema:
{
  "region": "<US city or 'unknown'>",
  "gender": "M" | "F" | "unknown",
  "age_band": "18-24" | "25-34" | "35-44" | "45-54" | "55+" | "unknown",
  "interests": ["<broad category>", ...],     // 0-5 items, e.g. "tech", "fashion", "home", "outdoors", "audio"
  "confidence": 0.0-1.0
}
Rules:
- Output "unknown" only when the events truly give no signal at all. When two or more signals converge in the same direction, COMMIT to a value rather than defaulting to unknown.
- Region only if a city/state is explicit in event properties; otherwise "unknown".
- Interests: lowercase nouns. Drop duplicates.

Signal cheat sheet — these patterns SHOULD commit to a value, not stay unknown:
  • cosmetics + women's fashion (Lululemon / Aritzia / Reformation / Glossier / Cetaphil) → gender "F"
  • men's grooming (Manscaped / Harrys / beard) + tools / power tools / auto → gender "M"
  • PS5 / Xbox + Razer / esports headset + Mountain Dew or Monster Energy → gender "M"
  • textbooks + gaming + energy drinks + dorm bedding → age_band "18-24"
  • Apple Watch / Whoop + premium audio + grooming + new-grad tech → age_band "25-34"
  • diapers / Pampers / kids LEGO + minivan accessories + family-sized appliances → age_band "35-44"
  • golf clubs / Titleist / FootJoy + premium scotch / wine + luxury watches → age_band "45-54"
  • AARP / reading glasses / medical alert / La-Z-Boy / heirloom seeds / gardening → age_band "55+"

Confidence: 0.2 if every field is unknown, 0.6 when one or two fields commit confidently, 0.8 when three or more fields commit and they reinforce each other.`;

function parseJSONLoose(text: string): unknown {
  const t = text.trim();
  // strip ```json ... ``` fence if present
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const body = fence ? fence[1] : t;
  return JSON.parse(body);
}

function clean(raw: unknown, eventCount: number): Demographics | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const allowedGender = new Set(['M', 'F', 'unknown']);
  const allowedAge = new Set(['18-24', '25-34', '35-44', '45-54', '55+', 'unknown']);
  const region = typeof r.region === 'string' && r.region.length > 0 ? r.region : 'unknown';
  const gender = (allowedGender.has(r.gender as string) ? r.gender : 'unknown') as Demographics['gender'];
  const age_band = (allowedAge.has(r.age_band as string) ? r.age_band : 'unknown') as Demographics['age_band'];
  const interests = Array.isArray(r.interests)
    ? Array.from(new Set(r.interests.filter((x) => typeof x === 'string' && x.length > 0).map((x) => String(x).toLowerCase()))).slice(0, 5)
    : [];
  const conf = typeof r.confidence === 'number' && r.confidence >= 0 && r.confidence <= 1 ? r.confidence : 0.3;
  return {
    region,
    gender,
    age_band,
    interests,
    confidence: conf,
    inferred_at: new Date().toISOString(),
    model: MODEL,
    event_count: eventCount,
  };
}

async function inferOne(userHash: string): Promise<{ ok: true; demographics: Demographics } | { ok: false; reason: string }> {
  const evRes = await ifFetch(
    'GET',
    `/api/database/records/events?user_hash=eq.${encodeURIComponent(userHash)}&select=event_type,site_id,properties,occurred_at&order=occurred_at.desc&limit=200`
  );
  if (!evRes.ok) return { ok: false, reason: `db ${evRes.status}` };
  const events = (await evRes.json()) as EventRow[];
  if (events.length < MIN_EVENTS) return { ok: false, reason: `only ${events.length} events (min ${MIN_EVENTS})` };

  const eventBlock = events
    .map((e) => `- [${e.occurred_at}] ${e.site_id}: ${e.event_type} ${JSON.stringify(e.properties)}`)
    .join('\n');

  const llm = await ifFetch('POST', '/api/ai/chat/completion', {
    model: MODEL,
    messages: [
      { role: 'system', content: SYS },
      { role: 'user', content: `Events:\n${eventBlock}\n\nReturn the JSON.` },
    ],
    maxTokens: 220,
    temperature: 0.1,
  });
  if (!llm.ok) return { ok: false, reason: `llm ${llm.status}` };
  const lj = (await llm.json()) as { text?: string };
  const text = lj.text?.trim() ?? '';
  if (!text) return { ok: false, reason: 'llm empty' };

  let parsed: unknown;
  try {
    parsed = parseJSONLoose(text);
  } catch {
    return { ok: false, reason: `bad json: ${text.slice(0, 80)}` };
  }
  const cleaned = clean(parsed, events.length);
  if (!cleaned) return { ok: false, reason: 'shape rejected' };
  return { ok: true, demographics: cleaned };
}

async function persist(userHash: string, d: Demographics): Promise<boolean> {
  const r = await ifFetch(
    'PATCH',
    `/api/database/records/users?user_hash=eq.${encodeURIComponent(userHash)}`,
    { demographics_json: d }
  );
  return r.ok;
}

function isFresh(d: unknown): boolean {
  if (!d || typeof d !== 'object') return false;
  const at = (d as Record<string, unknown>).inferred_at;
  if (typeof at !== 'string') return false;
  const ageMs = Date.now() - new Date(at).getTime();
  return ageMs < STALE_HOURS * 3600_000;
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

  const adminToken: string = body?.adminToken ?? '';
  if (!adminToken || adminToken !== SVC) {
    return json({ error: 'unauthorized — adminToken must match service key' }, 401);
  }

  const force: boolean = !!body?.force;
  const explicit: string[] | undefined = Array.isArray(body?.userHashes) ? body.userHashes : undefined;

  // Pull the candidate user list.
  const usersRes = await ifFetch(
    'GET',
    `/api/database/records/users?select=user_hash,demographics_json&order=created_at.desc&limit=200`
  );
  if (!usersRes.ok) return json({ error: 'users fetch failed', status: usersRes.status }, 502);
  const allUsers = (await usersRes.json()) as Array<{ user_hash: string; demographics_json: unknown }>;
  const targets = explicit ? allUsers.filter((u) => explicit.includes(u.user_hash)) : allUsers;

  const inferred: Array<{ user_hash: string; demographics: Demographics }> = [];
  const skipped: Array<{ user_hash: string; reason: string }> = [];

  for (const u of targets) {
    if (!force && isFresh(u.demographics_json)) {
      skipped.push({ user_hash: u.user_hash, reason: 'fresh (< 6h)' });
      continue;
    }
    const r = await inferOne(u.user_hash);
    if (!r.ok) {
      skipped.push({ user_hash: u.user_hash, reason: r.reason });
      continue;
    }
    const written = await persist(u.user_hash, r.demographics);
    if (!written) {
      skipped.push({ user_hash: u.user_hash, reason: 'persist failed' });
      continue;
    }
    inferred.push({ user_hash: u.user_hash, demographics: r.demographics });
  }

  return json({
    ok: true,
    total: targets.length,
    inferred_count: inferred.length,
    skipped_count: skipped.length,
    inferred,
    skipped,
  });
}
