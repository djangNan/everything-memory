import SiteSelector from "./components/SiteSelector";
import RecentUsers from "./components/RecentUsers";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ask anything about your users
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pick a site, then a user, and ask in plain English.
          </p>
        </div>
        <SiteSelector />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Recent users
        </h2>
        <RecentUsers />
      </section>

      <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Try a user manually
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Visit{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
            /users/&lt;sha256-of-email&gt;
          </code>{" "}
          to ask a question about a specific user.
        </p>
      </section>
    </div>
  );
}
