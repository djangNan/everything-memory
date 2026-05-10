// GET /functions/cohort-stats
// Aggregate-only counters for the admin dashboard. Never returns user_hash.
//
// Returns:
//   {
//     totals:            { users, users_inferred, events, sites, events_per_user_avg },
//     interests_top:     [{ name, users, share }],
//     gender:            { M, F, unknown },
//     age_band:          { '18-24', '25-34', '35-44', '45-54', '55+', unknown },
//     region:            [{ name, users }],
//     events_by_site:    [{ site_id, events }],
//     events_by_type:    [{ event_type, events }],
//     events_by_day:     [{ day: 'YYYY-MM-DD', events }],   // last 14d
//     top_products:      [{ name, views }],                  // top 8
//     recent_inferences: [{ user_hash_prefix, interests, gender, age_band, inferred_at }],  // hash truncated to 10 chars
//   }

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

async function ifFetch(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${SVC}` },
  });
}

type UserRow = {
  user_hash: string;
  demographics_json: any;
  created_at: string;
};
type EventRow = {
  event_type: string;
  site_id: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

function bumpCount<K extends string>(map: Record<K, number>, key: K): void {
  map[key] = (map[key] ?? 0) + 1;
}

function dayBucket(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
  }
  return out;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);

  const [usersRes, eventsRes, sitesRes] = await Promise.all([
    ifFetch(`/api/database/records/users?select=user_hash,demographics_json,created_at&limit=1000`),
    ifFetch(`/api/database/records/events?select=event_type,site_id,properties,occurred_at&order=occurred_at.desc&limit=2000`),
    ifFetch(`/api/database/records/sites?select=site_id`),
  ]);

  if (!usersRes.ok || !eventsRes.ok || !sitesRes.ok) {
    return json({ error: 'upstream fetch failed' }, 502);
  }

  const users = (await usersRes.json()) as UserRow[];
  const events = (await eventsRes.json()) as EventRow[];
  const sites = (await sitesRes.json()) as Array<{ site_id: string }>;

  // ── Demographics aggregates ──────────────────────────────
  const interestCount: Record<string, number> = {};
  const genderCount: Record<string, number> = { M: 0, F: 0, unknown: 0 };
  const ageCount: Record<string, number> = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0, unknown: 0 };
  const regionCount: Record<string, number> = {};
  let inferredCount = 0;
  const recent: Array<{ user_hash_prefix: string; interests: string[]; gender: string; age_band: string; region: string; inferred_at: string; confidence: number }> = [];

  for (const u of users) {
    const d = u.demographics_json;
    if (!d || typeof d !== 'object') continue;
    inferredCount++;
    if (Array.isArray(d.interests)) {
      for (const i of d.interests) {
        if (typeof i === 'string' && i.length > 0) bumpCount(interestCount, String(i).toLowerCase());
      }
    }
    bumpCount(genderCount, ['M', 'F'].includes(d.gender) ? d.gender : 'unknown');
    const age = ['18-24', '25-34', '35-44', '45-54', '55+'].includes(d.age_band) ? d.age_band : 'unknown';
    bumpCount(ageCount, age);
    const region = typeof d.region === 'string' && d.region && d.region !== 'unknown' ? d.region : 'unknown';
    bumpCount(regionCount, region);
    recent.push({
      user_hash_prefix: u.user_hash.slice(0, 10),
      interests: Array.isArray(d.interests) ? d.interests.slice(0, 5) : [],
      gender: d.gender ?? 'unknown',
      age_band: d.age_band ?? 'unknown',
      region: d.region ?? 'unknown',
      inferred_at: d.inferred_at ?? '',
      confidence: typeof d.confidence === 'number' ? d.confidence : 0,
    });
  }
  recent.sort((a, b) => (b.inferred_at || '').localeCompare(a.inferred_at || ''));

  const interestsSorted = Object.entries(interestCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, users]) => ({ name, users, share: inferredCount > 0 ? users / inferredCount : 0 }));

  const regionSorted = Object.entries(regionCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, users]) => ({ name, users }));

  // ── Event aggregates ────────────────────────────────────
  const eventsBySite: Record<string, number> = {};
  const eventsByType: Record<string, number> = {};
  const eventsByDay: Record<string, number> = {};
  const productViews: Record<string, number> = {};
  for (const e of events) {
    bumpCount(eventsBySite, e.site_id || 'unknown');
    bumpCount(eventsByType, e.event_type || 'unknown');
    bumpCount(eventsByDay, dayBucket(e.occurred_at));
    if (e.event_type === 'product_view' && e.properties && typeof e.properties === 'object') {
      const name = (e.properties as any).name;
      if (typeof name === 'string') bumpCount(productViews, name);
    }
  }

  const days = lastNDays(14);
  const eventsByDaySeries = days.map((day) => ({ day, events: eventsByDay[day] ?? 0 }));

  const topProducts = Object.entries(productViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, views]) => ({ name, views }));

  return json({
    totals: {
      users: users.length,
      users_inferred: inferredCount,
      events: events.length,
      sites: sites.length,
      events_per_user_avg: users.length === 0 ? 0 : Math.round((events.length / users.length) * 10) / 10,
    },
    interests_top: interestsSorted.slice(0, 12),
    gender: genderCount,
    age_band: ageCount,
    region: regionSorted,
    events_by_site: Object.entries(eventsBySite).sort(([, a], [, b]) => b - a).map(([site_id, n]) => ({ site_id, events: n })),
    events_by_type: Object.entries(eventsByType).sort(([, a], [, b]) => b - a).map(([event_type, n]) => ({ event_type, events: n })),
    events_by_day: eventsByDaySeries,
    top_products: topProducts,
    recent_inferences: recent.slice(0, 10),
  });
}
