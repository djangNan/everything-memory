// GET /functions/recent-users?limit=10
// Public listing of recent user_hash + event_count for the admin dashboard.
// Hashes are SHA-256 of an email — not PII on their own — so no auth required.

declare const Deno: { env: { get(k: string): string | undefined } };

const BASE = Deno.env.get('INSFORGE_INTERNAL_URL') ?? Deno.env.get('INSFORGE_BASE_URL') ?? '';
const SVC = Deno.env.get('API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

type RawUser = {
  user_hash: string;
  created_at: string;
  events: Array<{ count: number }>;
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);

  const url = new URL(req.url);
  const raw = parseInt(url.searchParams.get('limit') ?? '10', 10);
  const limit = Math.min(50, Math.max(1, isNaN(raw) ? 10 : raw));

  const path =
    `/api/database/records/users` +
    `?select=user_hash,created_at,events(count)` +
    `&order=created_at.desc&limit=${limit}`;

  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${SVC}` },
  });
  if (!r.ok) {
    const t = await r.text();
    return json({ error: 'upstream', status: r.status, detail: t.slice(0, 200) }, 502);
  }
  const rows = await r.json() as RawUser[];
  const users = rows.map((u) => ({
    user_hash: u.user_hash,
    created_at: u.created_at,
    event_count: u.events?.[0]?.count ?? 0,
  }));
  return json({ users });
}
