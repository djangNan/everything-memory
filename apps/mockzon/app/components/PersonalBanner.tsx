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
      <div className="mb-6 -mx-6 sm:mx-0 sm:rounded-lg bg-zinc-900 px-6 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center">
          <div className="h-3 w-48 animate-pulse rounded bg-zinc-700" />
        </div>
      </div>
    );
  }

  if (!answer) return null;

  return (
    <div className="mb-6 -mx-6 sm:mx-0 sm:rounded-lg bg-zinc-900 px-6 py-2.5 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="text-sm">
          <span className="text-zinc-400">Recommended for </span>
          <span className="font-medium">{answer.toLowerCase()}</span>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-zinc-400 transition hover:text-white"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
