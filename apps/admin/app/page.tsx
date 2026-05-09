import SiteSelector from "./components/SiteSelector";
import RecentUsers from "./components/RecentUsers";
import JumpToUser from "./components/JumpToUser";

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
          Open a user
        </h2>
        <JumpToUser />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Recent users
        </h2>
        <RecentUsers />
      </section>
    </div>
  );
}
