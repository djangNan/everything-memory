import Link from "next/link";

// Hardcoded demo hashes — admin listing endpoint requires server-only key.
// SHA-256 hex of the listed email (lowercased).
const DEMO_USERS: { email: string; hash: string }[] = [
  {
    email: "demo@user.com",
    // sha256("demo@user.com")
    hash: "8d1d3aa7632205cbd5bfbebcdc89a2d95827ba65a8c9221bd5129ee7def1d703",
  },
  {
    email: "alice@example.com",
    // sha256("alice@example.com")
    hash: "ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976",
  },
  {
    email: "bob@example.com",
    // sha256("bob@example.com")
    hash: "5ff860bf1190596c7188ab851db691f0f3169c453936e9e1eba2f9a47f7a0018",
  },
];

export default function RecentUsers() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <ul className="divide-y divide-slate-100">
        {DEMO_USERS.map((u) => (
          <li key={u.hash}>
            <Link
              href={`/users/${u.hash}`}
              className="flex items-center justify-between gap-4 rounded-md px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{u.email}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                  {u.hash}
                </p>
              </div>
              <span
                aria-hidden
                className="text-sm text-slate-400 group-hover:text-slate-900"
              >
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="px-4 py-2 text-[11px] text-slate-400">
        Demo seeds. Live listing arrives when the backend exposes a public
        users endpoint.
      </p>
    </div>
  );
}
