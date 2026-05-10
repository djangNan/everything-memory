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
  if (!product) return { title: "Not found — ModnZon" };
  return {
    title: `${product.name} — ModnZon`,
    description: product.blurb,
  };
}

function fakeRating(id: string): { rating: number; count: number } {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rating = 3.8 + ((h % 13) / 10);
  const count = 240 + (h % 9000);
  return { rating: Math.min(5, Number(rating.toFixed(1))), count };
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill={i < full ? "#ffa41c" : "#dddddd"}
        >
          <path d="M10 1l2.6 5.9 6.4.6-4.8 4.4 1.4 6.3L10 14.9 4.4 18.2l1.4-6.3L1 7.5l6.4-.6L10 1z" />
        </svg>
      ))}
    </span>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const { rating, count } = fakeRating(product.id);
  const original = Math.round(product.price * 1.35);
  const off = Math.round((1 - product.price / original) * 100);
  const fixed = product.price.toFixed(2);
  const [dollars, cents] = fixed.split(".");

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 6);

  return (
    <div className="bg-white">
      <TrackProductView product={product} />

      <div className="border-b border-[#dddddd] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-2 text-[12px] text-[#565959]">
          <Link href="/" className="hover:text-[#c7511f] hover:underline">
            ModnZon
          </Link>
          <span className="mx-1">›</span>
          <Link
            href="/"
            className="capitalize hover:text-[#c7511f] hover:underline"
          >
            {product.category.replace(/-/g, " ")}
          </Link>
          <span className="mx-1">›</span>
          <span className="text-[#0f1111]">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-3 py-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex gap-3">
              <div className="hidden flex-col gap-2 sm:flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`h-12 w-12 overflow-hidden rounded border ${
                      i === 0
                        ? "border-[#e77600] ring-2 ring-[#e77600]/30"
                        : "border-[#dddddd]"
                    }`}
                    aria-label={`Thumbnail ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        product.image ??
                        `https://placehold.co/100x100/ffffff/0f1111/png?text=${encodeURIComponent(product.name)}`
                      }
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
              <div className="flex aspect-square flex-1 items-center justify-center overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    product.image ??
                    `https://placehold.co/800x800/ffffff/0f1111/png?text=${encodeURIComponent(product.name)}&font=lato`
                  }
                  alt={product.name}
                  className="max-h-[520px] w-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h1 className="text-[24px] font-medium leading-tight text-[#0f1111]">
              {product.name}
            </h1>
            <Link
              href="/"
              className="mt-1 inline-block text-[12px] text-[#007185] hover:text-[#c7511f] hover:underline"
            >
              Visit the {product.category.replace(/-/g, " ")} Store
            </Link>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[14px] text-[#0f1111]">
                {rating.toFixed(1)}
              </span>
              <Stars rating={rating} />
              <span className="text-[14px] text-[#007185] hover:text-[#c7511f] hover:underline">
                {count.toLocaleString()} ratings
              </span>
            </div>
            <p className="mt-1 text-[12px] text-[#565959]">
              1K+ bought in past month
            </p>
            <hr className="my-3 border-[#dddddd]" />

            <div>
              <span className="rounded bg-[#cc0c39] px-1.5 py-0.5 text-[12px] font-bold text-white">
                Limited time deal
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-[22px] font-medium text-[#cc0c39]">
                -{off}%
              </span>
              <span className="text-[28px] font-medium text-[#0f1111]">
                <sup className="text-[14px]">$</sup>
                {dollars}
                <sup className="text-[14px]">{cents}</sup>
              </span>
            </div>
            <p className="text-[12px] text-[#565959]">
              List Price:{" "}
              <span className="line-through">
                ${original.toLocaleString()}
              </span>
            </p>

            <p className="mt-4 text-[14px] text-[#0f1111]">
              <span className="text-[#565959]">Color:</span>{" "}
              <span className="font-medium">Charcoal</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Charcoal", "Glacier White", "Twilight Blue"].map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className={`rounded border px-3 py-1.5 text-[13px] ${
                    i === 0
                      ? "border-[#e77600] ring-2 ring-[#e77600]/30"
                      : "border-[#dddddd] hover:border-[#888c8c]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <hr className="my-4 border-[#dddddd]" />

            <p className="text-[15px] font-bold text-[#0f1111]">
              About this item
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-snug text-[#0f1111]">
              <li>{product.blurb}</li>
              <li>
                Trusted by millions — backed by ModnZon&apos;s 30-day return
                policy and free Prime delivery.
              </li>
              <li>
                Designed to fit seamlessly into your daily routine with no
                setup hassle.
              </li>
              <li>
                Ships from and sold by ModnZon. Gift wrap available at checkout.
              </li>
            </ul>
          </div>

          <aside className="lg:col-span-3">
            <div className="rounded-md border border-[#dddddd] bg-white p-4">
              <p className="text-[28px] font-medium leading-none text-[#0f1111]">
                <sup className="text-[14px]">$</sup>
                {dollars}
                <sup className="text-[14px]">{cents}</sup>
              </p>
              <p className="mt-2 text-[13px] text-[#0f1111]">
                <span className="text-[#007185] hover:text-[#c7511f] hover:underline">
                  FREE Returns
                </span>
              </p>
              <p className="mt-1 text-[13px] text-[#0f1111]">
                <span className="font-bold">FREE delivery</span> Tomorrow.{" "}
                <span className="text-[#007185] hover:text-[#c7511f] hover:underline">
                  Order within 4 hrs
                </span>
              </p>
              <p className="mt-2 text-[13px] text-[#0f1111]">
                <span className="text-[#007185] hover:text-[#c7511f] hover:underline">
                  Deliver to Seoul 06236
                </span>
              </p>
              <p className="mt-3 text-[18px] font-medium text-[#007600]">
                In Stock
              </p>

              <label className="mt-3 block text-[13px] text-[#0f1111]">
                Quantity:{" "}
                <select
                  className="ml-1 rounded border border-[#d5d9d9] bg-[#f0f2f2] px-2 py-1 text-[13px]"
                  defaultValue="1"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="mt-3 block w-full rounded-full bg-[#ffd814] px-3 py-1.5 text-[13px] font-medium text-[#0f1111] ring-1 ring-[#fcd200] transition hover:bg-[#f7ca00]"
              >
                Add to Cart
              </button>
              <button
                type="button"
                className="mt-2 block w-full rounded-full bg-[#ffa41c] px-3 py-1.5 text-[13px] font-medium text-[#0f1111] ring-1 ring-[#ff8f00] transition hover:bg-[#fa8900]"
              >
                Buy Now
              </button>

              <hr className="my-3 border-[#dddddd]" />

              <dl className="space-y-1 text-[12px] text-[#0f1111]">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#565959]">Ships from</dt>
                  <dd>ModnZon</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#565959]">Sold by</dt>
                  <dd>ModnZon</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#565959]">Returns</dt>
                  <dd>
                    <span className="text-[#007185]">30-day refund</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#565959]">Payment</dt>
                  <dd>
                    <span className="text-[#007185]">Secure transaction</span>
                  </dd>
                </div>
              </dl>

              <label className="mt-3 flex items-start gap-2 text-[13px] text-[#0f1111]">
                <input type="checkbox" className="mt-0.5" />
                <span>
                  Add a gift receipt for easy returns.{" "}
                  <span className="text-[#007185] hover:underline">
                    Learn more
                  </span>
                </span>
              </label>

              <button
                type="button"
                className="mt-3 block w-full rounded-full border border-[#d5d9d9] bg-[#f7fafa] px-3 py-1.5 text-[13px] text-[#0f1111] transition hover:bg-[#e7eaea]"
              >
                Add to List
              </button>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-10 rounded border border-[#dddddd] bg-white p-5">
            <h2 className="text-[20px] font-bold text-[#0f1111]">
              Customers who viewed this item also viewed
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {related.map((rp) => {
                const r = fakeRating(rp.id);
                return (
                  <Link
                    key={rp.id}
                    href={`/p/${rp.id}`}
                    className="group flex flex-col"
                  >
                    <div className="aspect-square overflow-hidden rounded bg-[#f7f7f7]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          rp.image ??
                          `https://placehold.co/300x300/f7f7f7/0f1111/png?text=${encodeURIComponent(rp.name)}`
                        }
                        alt={rp.name}
                        loading="lazy"
                        className="h-full w-full object-contain transition group-hover:scale-[1.02]"
                      />
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#0f1111] group-hover:text-[#c7511f] group-hover:underline">
                      {rp.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Stars rating={r.rating} />
                      <span className="text-[12px] text-[#007185]">
                        {r.count.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] font-medium text-[#0f1111]">
                      ${rp.price.toLocaleString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
