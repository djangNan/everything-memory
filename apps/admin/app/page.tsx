import Dashboard from "./components/Dashboard";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          One profile, many sites — aggregate cohort signal across every
          connected site.
        </p>
      </div>

      <section className="mt-8">
        <Dashboard />
      </section>
    </div>
  );
}
