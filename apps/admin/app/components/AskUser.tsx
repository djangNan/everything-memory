"use client";

import { useEffect, useState } from "react";
import { sites, type Site } from "@/lib/sites";

type Source = {
  event_type: string;
  site_id: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

const STORAGE_KEY = "admin_selected_site";

export default function AskUser({ userHash }: { userHash: string }) {
  const [site, setSite] = useState<Site>(sites[0]);
  const [question, setQuestion] = useState(
    "What is this user interested in?"
  );
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const found = sites.find((s) => s.id === saved);
    if (found) setSite(found);
  }, []);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (!apiBase) {
      setError(
        "NEXT_PUBLIC_API_BASE is not set. Backend is not deployed yet."
      );
      setPending(false);
      return;
    }

    try {
      const r = await fetch(`${apiBase}/profile/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: site.apiKey,
          userHash,
          question,
        }),
      });
      if (!r.ok) {
        setError(`Request failed: ${r.status}`);
        return;
      }
      const data = await r.json();
      setAnswer(data.answer ?? null);
      setSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAsk}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Asking as {site.name}
          </p>
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          required
          className="mt-3 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          placeholder="Ask anything about this user…"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Asking…" : "Ask"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {answer ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Answer
          </p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-900">
            {answer}
          </p>
          {sources.length > 0 ? (
            <>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sources ({sources.length})
              </p>
              <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-100">
                {sources.map((s, i) => (
                  <li key={i} className="px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                        {s.site_id}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {s.event_type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {s.occurred_at}
                      </span>
                    </div>
                    <pre className="mt-1 overflow-x-auto text-[11px] text-slate-700">
                      {JSON.stringify(s.properties, null, 0)}
                    </pre>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
