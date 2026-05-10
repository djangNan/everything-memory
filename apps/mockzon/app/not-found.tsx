import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-5xl font-bold tracking-tight text-orange-500">404</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        That deal seems to be gone.
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        The product or page you&apos;re looking for is no longer available.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        Back to ModnZon
      </Link>
    </div>
  );
}
