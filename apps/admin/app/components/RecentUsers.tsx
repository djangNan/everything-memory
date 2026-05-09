"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RawUser = { user_hash: string; last_seen_at?: string };

export default function RecentUsers() {
  const [users, setUsers] = useState<RawUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (!apiBase) {
      setError("NEXT_PUBLIC_API_BASE not configured yet (waiting on backend deploy).");
      return;
    }
    // TODO: real endpoint TBD. For now show stub message.
    setError("Live user list endpoint not yet wired. Visit /users/<hash> directly to ask questions.");
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        {error}
      </div>
    );
  }

  if (!users) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading recent users…
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No users yet. Have someone log into a site that embeds em.js.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
      {users.map((u) => (
        <li key={u.user_hash}>
          <Link
            href={`/users/${u.user_hash}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
          >
            <span className="font-mono text-xs text-slate-700">
              {u.user_hash.slice(0, 16)}…
            </span>
            {u.last_seen_at ? (
              <span className="text-xs text-slate-400">{u.last_seen_at}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
