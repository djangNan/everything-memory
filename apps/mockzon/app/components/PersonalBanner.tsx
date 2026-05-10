"use client";

import { useEffect, useState } from "react";

const QUESTION =
  "What product category does this user prefer? Answer in 5 words or fewer (e.g. 'Apple fans', 'Gamers').";

export default function PersonalBanner() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    const apiKey = process.env.NEXT_PUBLIC_MOCKZON_KEY;
    const hash = window.localStorage.getItem("em_user_hash");
    if (!apiBase || !apiKey || !hash) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(`${apiBase}/profile-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, userHash: hash, question: QUESTION }),
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) return null;
        const data = (await r.json()) as { answer?: string } | null;
        const a = data?.answer?.trim();
        return a ? a : null;
      })
      .then((a) => setAnswer(a))
      .catch(() => setAnswer(null))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="mb-3 flex items-center justify-between gap-4 rounded bg-white px-4 py-2.5 shadow-sm ring-1 ring-[#dddddd]">
        <div className="h-3 w-56 animate-pulse rounded bg-[#eaeded]" />
        <div className="h-3 w-12 animate-pulse rounded bg-[#eaeded]" />
      </div>
    );
  }

  if (!answer) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-4 rounded bg-white px-4 py-2.5 shadow-sm ring-1 ring-[#dddddd]">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-[#0f1111]">
        <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#92400e]">
          Personalized
        </span>
        <span className="truncate">
          <span className="text-[#565959]">Recommended for </span>
          <span className="font-bold text-[#0f1111]">
            {answer.toLowerCase()}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-[18px] leading-none text-[#565959] transition hover:text-[#0f1111]"
      >
        ×
      </button>
    </div>
  );
}
