import Link from "next/link";
import { products } from "@/lib/products";
import PersonalBanner from "./components/PersonalBanner";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <PersonalBanner />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Today&apos;s deals
      </h1>
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/p/${product.id}`}
            className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-4 transition hover:shadow-md"
          >
            <div className="mb-3 flex aspect-square items-center justify-center rounded bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://placehold.co/400x400/fff7ed/9a3412/png?text=${encodeURIComponent(product.name)}`}
                alt={product.name}
                className="h-full w-full rounded object-cover"
              />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              {product.category}
            </p>
            <h2 className="mt-1 line-clamp-2 text-sm font-medium text-zinc-900 group-hover:text-orange-700">
              {product.name}
            </h2>
            <p className="mt-2 text-base font-bold text-orange-700">
              ${product.price.toLocaleString()}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
