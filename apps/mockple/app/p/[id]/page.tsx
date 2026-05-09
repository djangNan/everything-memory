import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";

type Params = { id: string };

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
  if (!product) return { title: "Not found — MockPle" };
  return {
    title: `${product.name} — MockPle`,
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
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-black">
        &larr; All products
      </Link>
      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://placehold.co/800x800/f4f4f5/1d1d1f/png?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {product.category}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-zinc-600">{product.blurb}</p>
          <p className="mt-6 text-2xl font-semibold">
            ${product.price.toLocaleString()}
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}
