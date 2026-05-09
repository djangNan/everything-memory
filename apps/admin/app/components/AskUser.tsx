"use client";

import { useState } from "react";

type Source = {
  event_type: string;
  site_id: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

type ProfileQueryResponse = {
  answer: string;
  sources: Source[];
};

const MAX_QUESTION_LEN = 500;
const DEFAULT_API_BASE = "https://p83mrur5.us-east.insforge.app/functions";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE;
}

function formatTimestamp(iso: string): string {
  // YYYY-MM-DD HH:mm — locale-stable, no seconds.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function truncate(s: string, n = 240): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function Spinner() {
  return (
    <span
      aria-label="Loading"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default function AskUser({
  userHash,
  apiKey,
}: {
  userHash: string;
  apiKey: string;
}) {
  const [question, setQuestion] = useState(
    "What is this user interested in?"
  );
  const [response, setResponse] = useState<ProfileQueryResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(true);

  const trimmed = question.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setError(null);

    try {
      const r = await fetch(`${getApiBase()}/profile-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          userHash,
          question: trimmed,
        }),
      });

      if (!r.ok) {
        let detail = "";
        try {
          detail = (await r.text()) || "";
        } catch {
          detail = "";
        }
        setError(
          `${r.status} ${r.statusText || "Request failed"}` +
            (detail ? ` — ${truncate(detail, 200)}` : "")
        );
        setResponse(null);
        return;
      }

      const data = (await r.json()) as Partial<ProfileQueryResponse>;
      setResponse({
        answer: typeof data.answer === "string" ? data.answer : "",
        sources: Array.isArray(data.sources) ? data.sources : [],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error — ${truncate(msg, 200)}`);
      setResponse(null);
    } finally {
      setPending(false);
    }
  }

  const charCount = question.length;
  const charOver = charCount > MAX_QUESTION_LEN;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAsk}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ask in plain English
          </span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={MAX_QUESTION_LEN + 50}
            className="mt-3 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm leading-relaxed shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            placeholder="What is this user interested in?"
          />
        </label>
        <div className="mt-2 flex items-center justify-between">
          <p
            className={
              "text-xs " +
              (charOver ? "text-red-600" : "text-slate-400")
            }
          >
            {charCount} / {MAX_QUESTION_LEN}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Spinner />
                <span>Asking…</span>
              </>
            ) : (
              <span>Ask</span>
            )}
          </button>
        </div>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Couldn’t reach the profile service.</p>
          <p className="mt-1 break-all font-mono text-xs text-red-600">
            {error}
          </p>
        </div>
      ) : null}

      {response ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Answer
          </p>
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-900">
            {response.answer || (
              <span className="text-slate-400">No answer returned.</span>
            )}
          </p>

          {response.sources.length > 0 ? (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSourcesOpen((v) => !v)}
                aria-expanded={sourcesOpen}
                className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
              >
                <span>
                  Sources ({response.sources.length} event
                  {response.sources.length === 1 ? "" : "s"})
                </span>
                <span aria-hidden className="text-slate-400">
                  {sourcesOpen ? "−" : "+"}
                </span>
              </button>

              {sourcesOpen ? (
                <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-100">
                  {response.sources.map((s, i) => (
                    <li key={i} className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                          {s.event_type}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                          {s.site_id}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {formatTimestamp(s.occurred_at)}
                        </span>
                      </div>
                      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-slate-600">
                        {JSON.stringify(s.properties)}
                      </pre>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">
              No source events returned.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
