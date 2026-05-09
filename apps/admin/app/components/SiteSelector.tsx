"use client";

import { useEffect, useState } from "react";
import { sites } from "@/lib/sites";

const STORAGE_KEY = "admin_selected_site";

export default function SiteSelector() {
  const [siteId, setSiteId] = useState<string>(sites[0].id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && sites.some((s) => s.id === saved)) setSiteId(saved);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSiteId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }

  return (
    <label className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700">Site</span>
      <select
        value={siteId}
        onChange={handleChange}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
