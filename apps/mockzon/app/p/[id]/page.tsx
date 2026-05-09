import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Not found — MockZon" };
  return {
    title: `${product.name} — MockZon`,
    description: product.blurb,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-orange-700">
        &larr; Back to MockZon
      </Link>
      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://placehold.co/800x800/fff7ed/9a3412/png?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {product.category}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-2 text-base text-zinc-700">{product.blurb}</p>
          <p className="mt-4 text-3xl font-bold text-orange-700">
            ${product.price.toLocaleString()}
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Add to cart
          </button>
          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center rounded-md bg-orange-300 px-6 py-2.5 text-sm font-semibold text-orange-950 transition hover:bg-orange-400"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
