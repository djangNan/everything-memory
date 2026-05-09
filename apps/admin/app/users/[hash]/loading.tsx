export default function LoadingUser() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-72 animate-pulse rounded bg-slate-100" />
      <div className="mt-8 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-20 w-full animate-pulse rounded-md bg-slate-100" />
          <div className="mt-3 flex justify-end">
            <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
