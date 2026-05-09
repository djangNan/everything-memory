"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecentUser = {
  user_hash: string;
  created_at: string;
  event_count: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://p83mrur5.us-east.insforge.app/functions";

function shortHash(h: string): string {
  if (h.length <= 16) return h;
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export default function RecentUsers() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; users: RecentUser[] }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/recent-users?limit=10`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { users?: RecentUser[] };
        if (!cancelled) setState({ kind: "ok", users: j.users ?? [] });
      })
      .catch((e) => {
        if (!cancelled)
          setState({ kind: "error", message: String(e?.message ?? e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <ul className="divide-y divide-slate-100">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-5 w-10 animate-pulse rounded bg-slate-100" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&rsquo;t load recent users — {state.message}
      </div>
    );
  }

  if (state.users.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No users yet. Have someone log in on a demo storefront.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <ul className="divide-y divide-slate-100">
        {state.users.map((u) => (
          <li key={u.user_hash}>
            <Link
              href={`/users/${u.user_hash}`}
              className="group flex items-center justify-between gap-4 rounded-md px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-slate-900">
                  {shortHash(u.user_hash)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {relativeTime(u.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {u.event_count} {u.event_count === 1 ? "event" : "events"}
                </span>
                <span
                  aria-hidden
                  className="text-sm text-slate-400 group-hover:text-slate-900"
                >
                  &rarr;
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
