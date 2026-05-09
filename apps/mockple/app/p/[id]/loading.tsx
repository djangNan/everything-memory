export default function LoadingProduct() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-zinc-100" />
        <div className="flex flex-col">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-9 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 h-7 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="mt-8 h-12 w-full animate-pulse rounded-full bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
