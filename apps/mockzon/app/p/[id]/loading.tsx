export default function LoadingProduct() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="h-4 w-24 animate-pulse rounded bg-orange-100" />
      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-lg bg-orange-50" />
        <div className="flex flex-col">
          <div className="h-3 w-20 animate-pulse rounded bg-orange-100" />
          <div className="mt-2 h-8 w-3/4 animate-pulse rounded bg-orange-100" />
          <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-orange-100" />
          <div className="mt-4 h-9 w-32 animate-pulse rounded bg-orange-200" />
          <div className="mt-6 h-10 w-full animate-pulse rounded-md bg-orange-200" />
          <div className="mt-2 h-10 w-full animate-pulse rounded-md bg-orange-100" />
        </div>
      </div>
    </div>
  );
}
