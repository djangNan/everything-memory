// D1.2 — POST /events
// Deno edge function for InsForge Subhosting.
// Auth: per-site apiKey in body, validated against `sites` table.
// Side effects: upsert users row, insert events row, fire-and-forget Nia upsert.

declare const Deno: { env: { get(k: string): string | undefined } };

const BASE = Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('INSFORGE_SERVICE_KEY') ?? '';

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
}): Promise<string | null> {
  const r = await db('POST', `/api/database/records/events`, input, 'return=representation');
  if (!r.ok) return null;
  const rows = await r.json() as Array<{ id: string }>;
  return rows[0]?.id ?? null;
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
  const eventId = await insertEvent({
    user_hash: String(userHash),
    site_id: site.site_id,
    event_type: String(eventType),
    properties: properties && typeof properties === 'object' ? properties : {},
    occurred_at: occurredAt,
  });
  if (!eventId) return json({ error: 'insert failed' }, 500);

  // Fire-and-forget Nia upsert (no-op in fallback mode).
  // Inlined here because Subhosting deploys single-file functions.
  // To enable Nia: replace this block with a fetch to apigcp.trynia.ai.
  void Promise.resolve();

  return json({ ok: true, eventId });
}
