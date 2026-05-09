"use client";

import { useRouter } from "next/navigation";
import { sites, isSiteId, type SiteId } from "@/lib/sites";

type Props = {
  // When mounted on a user page, redirect updates the ?site= query.
  // When mounted on the dashboard root, only persist locally.
  currentSite?: SiteId;
  userHash?: string;
};

const STORAGE_KEY = "admin_selected_site";

export default function SiteSelector({ currentSite, userHash }: Props) {
  const router = useRouter();
  const value: SiteId = currentSite ?? "mockple";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!isSiteId(next)) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }

    if (userHash) {
      router.push(`/users/${userHash}?site=${next}`);
    } else {
      router.refresh();
    }
  }

  return (
    <label className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700">Site</span>
      <select
        value={value}
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
