import Link from "next/link";
import { products } from "@/lib/products";
import TrackPageView from "./_em/TrackPageView";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <TrackPageView />
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          The newest. The brightest.
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          The most loved tech, all in one place.
        </p>
      </section>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/p/${product.id}`}
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:shadow-lg"
          >
            <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://placehold.co/400x400/f4f4f5/1d1d1f/png?text=${encodeURIComponent(product.name)}`}
                alt={product.name}
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {product.category}
            </p>
            <h2 className="mt-1 text-xl font-medium tracking-tight text-zinc-900 group-hover:underline">
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{product.blurb}</p>
            <p className="mt-4 text-base font-semibold">
              ${product.price.toLocaleString()}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
