import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Nothing here.
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Try the dashboard, or open a user by their hash.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
