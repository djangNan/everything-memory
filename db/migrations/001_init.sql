-- Everything Memory: initial schema
-- Apply on: InsForge dashboard SQL editor, OR `POST /api/database/migrations`.
-- Idempotent: safe to re-run (uses IF NOT EXISTS + ON CONFLICT).

create table if not exists sites (
  site_id text primary key,
  api_key text not null unique,
  display_name text not null,
  created_at timestamptz default now()
);

create table if not exists users (
  user_hash text primary key,
  demographics_json jsonb,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_hash text references users(user_hash),
  site_id text references sites(site_id),
  event_type text not null,
  properties jsonb not null default '{}',
  occurred_at timestamptz default now()
);

create index if not exists idx_events_user_hash on events(user_hash, occurred_at desc);

-- Demo seed (per CONTEXT.md §3.3)
insert into sites (site_id, api_key, display_name) values
  ('mockple', 'mockple_key_demo_2026', 'MockPle Store'),
  ('mockzon', 'mockzon_key_demo_2026', 'MockZon Marketplace')
on conflict (site_id) do nothing;
