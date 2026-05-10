"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Totals = {
  users: number;
  users_inferred: number;
  events: number;
  sites: number;
  events_per_user_avg: number;
};

type InterestRow = { name: string; users: number; share: number };
type SiteEventRow = { site_id: string; events: number };
type DayRow = { day: string; events: number };
type ProductRow = { name: string; views: number };
type RecentInference = {
  user_hash_prefix: string;
  interests: string[];
  gender: string;
  age_band: string;
  region: string;
  inferred_at: string;
  confidence: number;
};

type StatsResponse = {
  totals: Totals;
  interests_top: InterestRow[];
  gender: Record<string, number>;
  age_band: Record<string, number>;
  region: Array<{ name: string; users: number }>;
  events_by_site: SiteEventRow[];
  events_by_type: Array<{ event_type: string; events: number }>;
  events_by_day: DayRow[];
  top_products: ProductRow[];
  recent_inferences: RecentInference[];
};

const DEFAULT_API_BASE = "https://p83mrur5.us-east.insforge.app/functions";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE;
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtPct(share: number): string {
  return `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`;
}

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function Card({
  className = "",
  title,
  subtitle,
  children,
}: {
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm " + className
      }
    >
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </h3>
          {subtitle ? (
            <span className="text-xs text-slate-500">{subtitle}</span>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  accent = "text-slate-900",
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent}`}>
        {value}
      </p>
      <p className="mt-auto pt-1 text-xs text-slate-500">
        {subtitle ?? " "}
      </p>
    </div>
  );
}

function HBar({
  label,
  count,
  share,
  href,
  color = "bg-emerald-500",
  muted = false,
}: {
  label: string;
  count: number;
  share: number;
  href?: string;
  color?: string;
  muted?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, share));
  const widthStyle = { width: `${(pct * 100).toFixed(2)}%` };
  const inner = (
    <div
      className={
        "group relative flex w-full items-center gap-3 rounded-md px-2 py-1.5 " +
        (href ? "cursor-pointer hover:bg-slate-50" : "")
      }
    >
      <div className="w-28 shrink-0 truncate text-sm font-medium text-slate-700">
        {label}
      </div>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`${muted ? "bg-slate-300" : color} h-full rounded-full`}
          style={widthStyle}
        />
      </div>
      <div className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-600">
        <span className="font-semibold text-slate-900">{fmtNumber(count)}</span>
        <span className="ml-1 text-slate-400">{fmtPct(share)}</span>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function Sparkline({ series }: { series: DayRow[] }) {
  const w = 600;
  const h = 120;
  const padX = 8;
  const padY = 12;
  const max = Math.max(1, ...series.map((d) => d.events));
  const yMax = Math.ceil(max * 1.2);
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

  const points = series.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH * (1 - d.events / yMax);
    return [x, y] as const;
  });
  const pathD = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaD =
    points.length > 0
      ? `${pathD} L${(padX + (series.length - 1) * stepX).toFixed(1)},${(padY + innerH).toFixed(1)} L${padX.toFixed(1)},${(padY + innerH).toFixed(1)} Z`
      : "";

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block h-32 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={padX}
          x2={w - padX}
          y1={padY + innerH}
          y2={padY + innerH}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        {areaD ? <path d={areaD} fill="url(#sparkfill)" /> : null}
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="#10b981" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-400">
        <span>{series[0]?.day ?? ""}</span>
        <span>max {fmtNumber(yMax)}</span>
        <span>{series[series.length - 1]?.day ?? ""}</span>
      </div>
    </div>
  );
}

function GenderBars({ gender }: { gender: Record<string, number> }) {
  const m = gender.M ?? 0;
  const f = gender.F ?? 0;
  const u = gender.unknown ?? 0;
  const total = m + f + u;
  const rows = [
    { key: "M", label: "Male", count: m, color: "bg-violet-500", muted: false },
    {
      key: "F",
      label: "Female",
      count: f,
      color: "bg-pink-500",
      muted: false,
    },
    {
      key: "unknown",
      label: "Unknown",
      count: u,
      color: "bg-slate-400",
      muted: true,
    },
  ];
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <HBar
          key={r.key}
          label={r.label}
          count={r.count}
          share={total > 0 ? r.count / total : 0}
          color={r.color}
          muted={r.muted}
        />
      ))}
    </div>
  );
}

function AgeBars({ ageBand }: { ageBand: Record<string, number> }) {
  const order = ["18-24", "25-34", "35-44", "45-54", "55+", "unknown"];
  const total = order.reduce((acc, k) => acc + (ageBand[k] ?? 0), 0);
  return (
    <div className="space-y-1">
      {order.map((k) => {
        const c = ageBand[k] ?? 0;
        const muted = k === "unknown";
        return (
          <HBar
            key={k}
            label={k === "unknown" ? "Unknown" : k}
            count={c}
            share={total > 0 ? c / total : 0}
            color="bg-emerald-500"
            muted={muted}
          />
        );
      })}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "animate-pulse rounded-md bg-slate-200/60 " + className
      }
    />
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="lg:col-span-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
      <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${getApiBase()}/cohort-stats`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!r.ok) {
          throw new Error(`${r.status} ${r.statusText}`);
        }
        const j = (await r.json()) as StatsResponse;
        if (!cancelled) setData(j);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isEmpty = useMemo(() => {
    if (!data) return false;
    return (
      data.totals.users === 0 &&
      data.totals.events === 0 &&
      data.totals.sites === 0
    );
  }, [data]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        <p className="font-semibold">Couldn&rsquo;t load dashboard stats.</p>
        <p className="mt-1 break-all font-mono text-xs text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  if (isEmpty) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-slate-900">
          No data yet
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Once a connected site emits events and demographics are inferred,
          aggregates will appear here.
        </p>
      </div>
    );
  }

  const t = data.totals;
  const interests = (data.interests_top ?? []).slice(0, 10);
  const interestMaxShare = Math.max(0.0001, ...interests.map((i) => i.share));
  const sitesEvents = data.events_by_site ?? [];
  const siteMax = Math.max(1, ...sitesEvents.map((s) => s.events));
  const products = data.top_products ?? [];
  const productMax = Math.max(1, ...products.map((p) => p.views));
  const recents = (data.recent_inferences ?? []).slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* KPI row */}
      <div className="md:col-span-1 lg:col-span-3">
        <KpiCard
          label="Users"
          value={fmtNumber(t.users)}
          subtitle={`${t.events_per_user_avg} events / user avg`}
        />
      </div>
      <div className="md:col-span-1 lg:col-span-3">
        <KpiCard
          label="Inferred"
          value={fmtNumber(t.users_inferred)}
          subtitle={
            t.users > 0
              ? `${fmtPct(t.users_inferred / t.users)} of users`
              : "0% of users"
          }
        />
      </div>
      <div className="md:col-span-1 lg:col-span-3">
        <KpiCard label="Events" value={fmtNumber(t.events)} />
      </div>
      <div className="md:col-span-1 lg:col-span-3">
        <KpiCard
          label="Sites integrated"
          value={fmtNumber(t.sites)}
          accent="text-emerald-600"
        />
      </div>

      {/* Cohort distribution (interests) */}
      <div className="md:col-span-2 lg:col-span-7">
        <Card
          title="Cohort distribution — interests"
          subtitle={`top ${interests.length} of ${data.interests_top.length}`}
        >
          {interests.length === 0 ? (
            <p className="text-sm text-slate-400">No inferred interests yet.</p>
          ) : (
            <div className="space-y-1">
              {interests.map((it) => (
                <HBar
                  key={it.name}
                  label={it.name}
                  count={it.users}
                  share={it.share / interestMaxShare}
                  href={`/query?interest=${encodeURIComponent(it.name)}`}
                  color="bg-emerald-500"
                />
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            Click a bar to open the cohort console with this interest pre-filled.
          </p>
        </Card>
      </div>

      {/* Events over time */}
      <div className="md:col-span-2 lg:col-span-5">
        <Card
          title="Events over time"
          subtitle={`last ${data.events_by_day?.length ?? 0} days`}
        >
          {data.events_by_day && data.events_by_day.length > 0 ? (
            <Sparkline series={data.events_by_day} />
          ) : (
            <p className="text-sm text-slate-400">No events recorded.</p>
          )}
        </Card>
      </div>

      {/* Cross-site activity (events by site) */}
      <div className="md:col-span-2 lg:col-span-7">
        <Card
          title="Cross-site activity"
          subtitle={`${fmtNumber(t.events)} events from ${t.sites} sites integrated`}
        >
          {sitesEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No site activity yet.</p>
          ) : (
            <div className="space-y-1">
              {sitesEvents.map((s) => (
                <HBar
                  key={s.site_id}
                  label={s.site_id}
                  count={s.events}
                  share={s.events / siteMax}
                  color="bg-violet-500"
                />
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            One profile, many sites — the unified view is the cross-site value.
          </p>
        </Card>
      </div>

      {/* Gender + Age (stacked into 5-col area) */}
      <div className="md:col-span-1 lg:col-span-5">
        <div className="flex h-full flex-col gap-4">
          <div className="flex-1">
            <Card title="Gender split">
              <GenderBars gender={data.gender ?? {}} />
            </Card>
          </div>
          <div className="flex-1">
            <Card title="Age band">
              <AgeBars ageBand={data.age_band ?? {}} />
            </Card>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="md:col-span-2 lg:col-span-7">
        <Card title="Top products viewed" subtitle={`top ${products.length}`}>
          {products.length === 0 ? (
            <p className="text-sm text-slate-400">No product views yet.</p>
          ) : (
            <ul className="space-y-1">
              {products.map((p) => (
                <li key={p.name}>
                  <HBar
                    label={p.name}
                    count={p.views}
                    share={p.views / productMax}
                    color="bg-emerald-500"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent inferences */}
      <div className="md:col-span-2 lg:col-span-5">
        <Card title="Recent inferences" subtitle="last 5">
          {recents.length === 0 ? (
            <p className="text-sm text-slate-400">No inferences yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recents.map((r) => {
                const conf = Math.max(0, Math.min(1, r.confidence));
                return (
                  <li
                    key={r.user_hash_prefix + r.inferred_at}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-slate-700">
                        {r.user_hash_prefix}…
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {timeAgo(r.inferred_at)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {r.gender && r.gender !== "unknown" ? (
                        <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                          {r.gender}
                        </span>
                      ) : null}
                      {r.age_band && r.age_band !== "unknown" ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                          {r.age_band}
                        </span>
                      ) : null}
                      {(r.interests ?? []).map((i) => (
                        <span
                          key={i}
                          className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(conf * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[10px] tabular-nums text-slate-500">
                        {Math.round(conf * 100)}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
