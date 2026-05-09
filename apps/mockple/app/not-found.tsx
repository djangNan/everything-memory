import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        It may have been moved or never existed.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        Back to MockPle
      </Link>
    </div>
  );
}
