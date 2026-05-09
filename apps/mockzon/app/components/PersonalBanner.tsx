"use client";

import { useEffect, useState } from "react";

export default function PersonalBanner() {
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = window.localStorage.getItem("demo_email");
    if (!email) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    const apiKey = process.env.NEXT_PUBLIC_MOCKZON_KEY;
    const userHash = window.localStorage.getItem("em_user_hash");
    if (!apiBase || !apiKey || !userHash) {
      // em.js stub not yet wired or backend not deployed.
      return;
    }

    setLoading(true);
    fetch(`${apiBase}/profile/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        userHash,
        question:
          "Summarize this user's shopping interests in one short sentence for a personalized banner.",
      }),
    })
      .then((r) => r.json())
      .then((d) => setBanner(d.answer ?? null))
      .catch(() => setBanner(null))
      .finally(() => setLoading(false));
  }, []);

  if (!banner && !loading) return null;
  return (
    <div className="mb-8 rounded-xl border-l-4 border-orange-500 bg-orange-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
        Recommended for you
      </p>
      <p className="mt-1 text-lg font-semibold text-orange-950">
        {loading ? "Personalizing your homepage…" : banner}
      </p>
    </div>
  );
}
