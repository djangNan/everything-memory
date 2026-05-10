"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Source = {
  event_type: string;
  site_id: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

type CohortQueryResponse = {
  answer: string;
  sources: Source[];
  cohort: {
    size: number;
    filters: Filters;
    min_size: number;
    k_anonymous: boolean;
  };
  via: "nia" | "fallback" | "refused" | "empty";
  nia?: { used: boolean; hits: number; raw?: number };
};

type Gender = "" | "M" | "F";
type AgeBand = "" | "18-24" | "25-34" | "35-44" | "45-54" | "55+";

type Filters = {
  region?: string;
  gender?: "M" | "F";
  age_band?: AgeBand extends "" ? never : Exclude<AgeBand, "">;
  interests?: string[];
};

const AGE_BANDS: AgeBand[] = ["", "18-24", "25-34", "35-44", "45-54", "55+"];
const SUGGESTED_INTERESTS = [
  "tech",
  "fashion",
  "beauty",
  "outdoors",
  "audio",
  "laptops",
  "phones",
  "tablets",
  "home",
];

const MAX_QUESTION_LEN = 500;
const DEFAULT_API_BASE = "https://p83mrur5.us-east.insforge.app/functions";
const DEFAULT_ADMIN_KEY = "admin_key_demo_2026";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE;
}

function getAdminApiKey(): string {
  return process.env.NEXT_PUBLIC_ADMIN_API_KEY || DEFAULT_ADMIN_KEY;
}

function formatTimestamp(iso: string): string {
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

function describeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.region) parts.push(`region=${f.region}`);
  if (f.gender) parts.push(`gender=${f.gender}`);
  if (f.age_band) parts.push(`age_band=${f.age_band}`);
  if (f.interests && f.interests.length > 0)
    parts.push(`interests=[${f.interests.join(", ")}]`);
  return parts.length === 0 ? "all users" : parts.join(" · ");
}

function Spinner() {
  return (
    <span
      aria-label="Loading"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

function ViaBadge({
  via,
  nia,
}: {
  via: CohortQueryResponse["via"];
  nia?: CohortQueryResponse["nia"];
}) {
  if (via === "nia") {
    return (
      <span
        title={`Nia returned ${nia?.raw ?? "?"} raw results, ${nia?.hits ?? 0} matched this cohort`}
        className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
        via Nia · {nia?.hits ?? 0} hits
      </span>
    );
  }
  if (via === "fallback") {
    return (
      <span
        title="Nia returned no matches; answered from cohort DB events"
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        via DB fallback
      </span>
    );
  }
  if (via === "refused") {
    return (
      <span
        title="Cohort below k-anonymity threshold; no synthesis"
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        refused — too small
      </span>
    );
  }
  return (
    <span
      title="Cohort matched but has no recorded events"
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      no events
    </span>
  );
}

function KAnonBadge({ size, k }: { size: number; k: boolean }) {
  if (k) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        k-anonymous
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      refused — too small ({size})
    </span>
  );
}

export default function CohortConsole() {
  const searchParams = useSearchParams();
  const initialInterest =
    (searchParams?.get("interest") || "").trim().toLowerCase() || "";

  const [region, setRegion] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [ageBand, setAgeBand] = useState<AgeBand>("");
  const [interests, setInterests] = useState<string[]>(
    initialInterest ? [initialInterest] : []
  );
  const [interestDraft, setInterestDraft] = useState("");
  const [question, setQuestion] = useState(
    "What is this cohort interested in?"
  );
  const [response, setResponse] = useState<CohortQueryResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [eventsTotal, setEventsTotal] = useState<number | null>(null);

  const apiKey = getAdminApiKey();

  const trimmed = question.trim();
  const charCount = question.length;
  const charOver = charCount > MAX_QUESTION_LEN;
  const canSubmit = trimmed.length > 0 && !pending && !charOver;

  // Re-sync if the search param changes (URL navigation between bars).
  useEffect(() => {
    if (!initialInterest) return;
    setInterests((prev) =>
      prev.includes(initialInterest) ? prev : [...prev, initialInterest]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInterest]);

  // Fetch totals once for the lead-in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${getApiBase()}/cohort-stats`, { method: "GET" });
        if (!r.ok) return;
        const j = (await r.json()) as { totals?: { events?: number } };
        if (!cancelled && typeof j.totals?.events === "number") {
          setEventsTotal(j.totals.events);
        }
      } catch {
        /* ignore — lead-in falls back */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleInterest(value: string) {
    const v = value.trim().toLowerCase();
    if (!v) return;
    setInterests((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function addInterestFromDraft() {
    const v = interestDraft.trim().toLowerCase();
    if (!v) return;
    if (!interests.includes(v)) setInterests([...interests, v]);
    setInterestDraft("");
  }

  function buildFilters(): Filters {
    const f: Filters = {};
    if (region.trim()) f.region = region.trim();
    if (gender === "M" || gender === "F") f.gender = gender;
    if (ageBand !== "") {
      f.age_band = ageBand as Exclude<AgeBand, "">;
    }
    if (interests.length > 0) f.interests = interests.slice(0, 5);
    return f;
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setError(null);

    try {
      const r = await fetch(`${getApiBase()}/cohort-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          filters: buildFilters(),
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

      const data = (await r.json()) as Partial<CohortQueryResponse>;
      setResponse({
        answer: typeof data.answer === "string" ? data.answer : "",
        sources: Array.isArray(data.sources) ? data.sources : [],
        cohort:
          data.cohort ?? {
            size: 0,
            filters: buildFilters(),
            min_size: 2,
            k_anonymous: false,
          },
        via: (data.via as CohortQueryResponse["via"]) ?? "empty",
        nia: data.nia,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error — ${truncate(msg, 200)}`);
      setResponse(null);
    } finally {
      setPending(false);
    }
  }

  const leadIn =
    eventsTotal !== null
      ? `Across all connected sites · ${new Intl.NumberFormat("en-US").format(eventsTotal)} events integrated`
      : `Across all connected sites`;

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
        {leadIn}
      </div>

      <form
        onSubmit={handleAsk}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Region
            </span>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. San Francisco — leave empty for any"
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gender
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              <option value="">Any</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Age band
            </span>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value as AgeBand)}
              className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              {AGE_BANDS.map((b) => (
                <option key={b || "any"} value={b}>
                  {b === "" ? "Any" : b}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Interests
            <span className="ml-2 text-[11px] font-normal normal-case text-slate-400">
              click chips or type your own — empty = no filter
            </span>
          </span>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_INTERESTS.map((tag) => {
              const on = interests.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition " +
                    (on
                      ? "bg-slate-900 text-white ring-1 ring-inset ring-slate-900"
                      : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200")
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={interestDraft}
              onChange={(e) => setInterestDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterestFromDraft();
                }
              }}
              placeholder="add custom interest, press Enter"
              className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={addInterestFromDraft}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add
            </button>
          </div>

          {interests.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    aria-label={`Remove ${tag}`}
                    className="text-emerald-600 hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Question
          </span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={MAX_QUESTION_LEN + 50}
            className="mt-2 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm leading-relaxed shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            placeholder="What does this cohort tend to buy?"
          />
        </label>

        <div className="mt-2 flex items-center justify-between">
          <p
            className={
              "text-xs " + (charOver ? "text-red-600" : "text-slate-400")
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
          <p className="font-semibold">Couldn&rsquo;t reach the cohort service.</p>
          <p className="mt-1 break-all font-mono text-xs text-red-600">
            {error}
          </p>
        </div>
      ) : null}

      {response ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                {response.cohort.size}{" "}
                {response.cohort.size === 1 ? "user" : "users"}
                <span className="text-slate-400"> · </span>
                <span className="text-slate-600">
                  {describeFilters(response.cohort.filters)}
                </span>
              </span>
              <KAnonBadge
                size={response.cohort.size}
                k={response.cohort.k_anonymous}
              />
            </div>
            <ViaBadge via={response.via} nia={response.nia} />
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Answer
            </p>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-900">
              {response.answer || (
                <span className="text-slate-400">No answer returned.</span>
              )}
            </p>
          </div>

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
