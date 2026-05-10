// D1.2 — POST /events
// Deno edge function for InsForge Subhosting.
// Auth: per-site apiKey in body, validated against `sites` table.
// Side effects: upsert users row, insert events row, fire-and-forget Nia upsert.

declare const Deno: { env: { get(k: string): string | undefined } };

// Subhosting auto-injects: API_KEY, ANON_KEY, INSFORGE_BASE_URL, INSFORGE_INTERNAL_URL.
// NIA_API_KEY pushed via /api/secrets so it shows up in Deno.env too.
const BASE = Deno.env.get('INSFORGE_INTERNAL_URL') ?? Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('API_KEY') ?? '';
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

async function db(method: string, path: string, body?: unknown, prefer?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${SVC}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers['Prefer'] = prefer;
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function siteForApiKey(apiKey: string): Promise<{ site_id: string } | null> {
  const r = await db('GET', `/api/database/records/sites?api_key=eq.${encodeURIComponent(apiKey)}`);
  if (!r.ok) return null;
  const rows = await r.json() as Array<{ site_id: string }>;
  return rows[0] ?? null;
}

async function ensureUser(userHash: string): Promise<void> {
  const exists = await db('GET', `/api/database/records/users?user_hash=eq.${encodeURIComponent(userHash)}&select=user_hash`);
  if (exists.ok) {
    const rows = await exists.json() as unknown[];
    if (rows.length > 0) return;
  }
  // Insert (ignore conflict — race-safe enough for hackathon)
  await db('POST', `/api/database/records/users`, { user_hash: userHash });
}

async function insertEvent(input: {
  user_hash: string;
  site_id: string;
  event_type: string;
  properties: Record<string, unknown>;
  occurred_at?: string;
}): Promise<{ id: string; occurred_at: string } | null> {
  const r = await db('POST', `/api/database/records/events`, input, 'return=representation');
  if (!r.ok) return null;
  const rows = await r.json() as Array<{ id: string; occurred_at: string }>;
  return rows[0] ?? null;
}

// Fire-and-forget save to Nia Context Sharing.
// Runs in episodic memory (7d TTL) — long enough for the demo + a week of judging.
async function saveToNia(event: {
  user_hash: string;
  site_id: string;
  event_type: string;
  properties: Record<string, unknown>;
  occurred_at: string;
}): Promise<void> {
  if (!NIA_KEY) return;
  const shortHash = event.user_hash.slice(0, 12);
  const propStr = JSON.stringify(event.properties);
  const niceProps = Object.entries(event.properties)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(', ');
  try {
    await fetch(`${NIA}/contexts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${NIA_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${shortHash} — ${event.event_type} on ${event.site_id}`,
        summary: `User ${shortHash} performed ${event.event_type} on ${event.site_id} at ${event.occurred_at}.${niceProps ? ' Properties: ' + niceProps + '.' : ''}`,
        content: `User ${event.user_hash} (short ${shortHash}) performed event ${event.event_type} on site ${event.site_id} at ${event.occurred_at}. Properties JSON: ${propStr}.`,
        tags: [shortHash, event.site_id, event.event_type],
        agent_source: 'em-events',
        memory_type: 'episodic',
        metadata: {
          user_hash: event.user_hash,
          site_id: event.site_id,
          event_type: event.event_type,
          properties: event.properties,
          occurred_at: event.occurred_at,
        },
      }),
    });
  } catch (_) {
    // best effort
  }
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

  const { apiKey, userHash, eventType, properties, occurredAt } = body ?? {};
  if (!apiKey || !userHash || !eventType) {
    return json({ error: 'apiKey, userHash, eventType required' }, 400);
  }

  const site = await siteForApiKey(String(apiKey));
  if (!site) return json({ error: 'invalid apiKey' }, 401);

  await ensureUser(String(userHash));
  const propsClean = properties && typeof properties === 'object' ? properties : {};
  const inserted = await insertEvent({
    user_hash: String(userHash),
    site_id: site.site_id,
    event_type: String(eventType),
    properties: propsClean,
    occurred_at: occurredAt,
  });
  if (!inserted) return json({ error: 'insert failed' }, 500);

  // Fire-and-forget Nia context save. Subhosting keeps async tasks alive briefly
  // after the response; if it gets cut, we just lose this event in Nia (DB is canonical).
  void saveToNia({
    user_hash: String(userHash),
    site_id: site.site_id,
    event_type: String(eventType),
    properties: propsClean,
    occurred_at: inserted.occurred_at,
  });

  return json({ ok: true, eventId: inserted.id });
}
