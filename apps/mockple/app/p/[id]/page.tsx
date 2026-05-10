import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";
import TrackProductView from "@/app/_em/TrackProductView";

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
  if (!product) return { title: "Not found — ModnPle" };
  return {
    title: `${product.name} — ModnPle`,
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
    <div className="bg-white">
      <TrackProductView product={product} />

      <div className="border-b border-[#d2d2d7] bg-[#f5f5f7]/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 text-[13px]">
          <div className="flex items-center gap-3 text-[#1d1d1f]">
            <span className="font-semibold">{product.name}</span>
            <span className="hidden text-[#6e6e73] sm:inline">·</span>
            <Link href="/" className="hidden text-[#6e6e73] hover:underline sm:inline">
              Overview
            </Link>
            <Link href="/" className="hidden text-[#6e6e73] hover:underline sm:inline">
              Specs
            </Link>
            <Link href="/" className="hidden text-[#6e6e73] hover:underline sm:inline">
              Compare
            </Link>
          </div>
          <Link
            href={`/p/${product.id}`}
            className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-3.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#0077ed]"
          >
            Buy
          </Link>
        </div>
      </div>

      <section className="bg-white pt-14 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#6e6e73]">
          {product.category}
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-[#1d1d1f] sm:text-7xl">
          {product.name}
        </h1>
        <p className="mt-4 px-6 text-2xl font-medium tracking-tight text-[#1d1d1f]/80 sm:text-3xl">
          {product.blurb}
        </p>
        <p className="mt-5 text-[13px] text-[#6e6e73]">
          From ${product.price.toLocaleString()} or available at modnple.com/shop.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm sm:text-base">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-6 py-2.5 font-medium text-white transition hover:bg-[#0077ed]"
          >
            Buy
          </button>
          <button
            type="button"
            className="font-medium text-[#0071e3] transition hover:underline"
          >
            Learn more &rsaquo;
          </button>
        </div>
        <div className="mx-auto mt-12 max-w-4xl px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              product.image ??
              `https://placehold.co/1600x1100/f5f5f7/1d1d1f/png?text=${encodeURIComponent(product.name)}&font=lora`
            }
            alt={product.name}
            className="mx-auto w-full object-contain"
          />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
              Built for it
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              Engineered to last.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#1d1d1f]/75">
              Designed in California. Crafted with recycled materials. Tested in
              the harshest environments so it just works, every day.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
              All-day power
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              Battery to keep up.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#1d1d1f]/75">
              Wake up. Get to work. Stream a movie. Take it on a plane. Then
              do it all over again — without reaching for the charger.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
              Privacy
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              That&apos;s ModnPle.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#1d1d1f]/75">
              Your data, your decision. Industry-leading on-device intelligence
              so the things you do with it stay between you and your device.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-2xl bg-[#f5f5f7] p-8 text-center sm:p-12">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
            Ready when you are
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Get the {product.name}.
          </h2>
          <p className="mt-3 text-[15px] text-[#6e6e73]">
            From ${product.price.toLocaleString()}. Free engraving. Free delivery.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-6 py-2.5 font-medium text-white transition hover:bg-[#0077ed]"
            >
              Buy now
            </button>
            <Link href="/" className="font-medium text-[#0071e3] hover:underline">
              Continue shopping &rsaquo;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
