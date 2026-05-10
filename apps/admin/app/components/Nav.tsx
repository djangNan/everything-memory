"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: Array<{ href: string; label: string; match: (p: string) => boolean }> = [
  { href: "/", label: "Dashboard", match: (p) => p === "/" },
  {
    href: "/query",
    label: "Cohort console",
    match: (p) => p === "/query" || p.startsWith("/query/"),
  },
];

export default function Nav() {
  const pathname = usePathname() || "/";
  return (
    <nav className="flex items-center gap-1 text-sm">
      {ITEMS.map((it) => {
        const active = it.match(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={
              "rounded-md px-2.5 py-1 transition " +
              (active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:text-white")
            }
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
