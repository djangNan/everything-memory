import Link from "next/link";
import type { Product } from "@/lib/products";
import { products } from "@/lib/products";
import PersonalBanner from "./components/PersonalBanner";
import TrackPageView from "./_em/TrackPageView";

const PROMO_CATEGORIES: { title: string; ids: string[]; cta: string }[] = [
  {
    title: "Refresh your space",
    ids: ["instant-pot-duo", "ninja-air-fryer", "vitamix-5200", "yeti-tumbler"],
    cta: "See more",
  },
  {
    title: "Top deals in Audio",
    ids: ["airpods-pro", "wh-1000xm5", "bose-qc-ultra", "jbl-flip-6"],
    cta: "See all deals",
  },
  {
    title: "Make your home smarter",
    ids: ["echo-dot", "echo-show-8", "ring-doorbell", "fire-tv-stick"],
    cta: "Explore more",
  },
  {
    title: "Gaming gear",
    ids: ["switch-oled", "ps5", "xbox-series-x", "lego-x-wing"],
    cta: "See more",
  },
];

function priceParts(p: number): { dollars: string; cents: string } {
  const fixed = p.toFixed(2);
  const [d, c] = fixed.split(".");
  return { dollars: d ?? "0", cents: c ?? "00" };
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
    <span className="inline-flex items-center gap-1 text-[12px]">
      <span className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill={i < full ? "#ffa41c" : "#dddddd"}
          >
            <path d="M10 1l2.6 5.9 6.4.6-4.8 4.4 1.4 6.3L10 14.9 4.4 18.2l1.4-6.3L1 7.5l6.4-.6L10 1z" />
          </svg>
        ))}
      </span>
      <span className="text-[#007185]">{rating.toFixed(1)}</span>
    </span>
  );
}

function PromoMini({ product }: { product: Product }) {
  return (
    <Link
      href={`/p/${product.id}`}
      className="group flex flex-col"
    >
      <div className="aspect-square w-full overflow-hidden rounded bg-[#f7f7f7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            product.image ??
            `https://placehold.co/300x300/f7f7f7/0f1111/png?text=${encodeURIComponent(product.name)}&font=lato`
          }
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition group-hover:scale-[1.02]"
        />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[12px] leading-tight text-[#0f1111]">
        {product.name}
      </p>
    </Link>
  );
}

function DealCard({ product }: { product: Product }) {
  const { rating, count } = fakeRating(product.id);
  const original = Math.round(product.price * 1.35);
  const off = Math.round((1 - product.price / original) * 100);
  const { dollars, cents } = priceParts(product.price);
  return (
    <Link
      href={`/p/${product.id}`}
      className="group flex flex-col rounded bg-white p-3 ring-1 ring-[#dddddd] transition hover:ring-[#c7c7c7]"
    >
      <div className="relative mb-2 flex aspect-square items-center justify-center overflow-hidden rounded bg-white">
        <span className="absolute left-2 top-2 z-10 rounded bg-[#cc0c39] px-1.5 py-0.5 text-[11px] font-bold text-white">
          -{off}%
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            product.image ??
            `https://placehold.co/600x600/ffffff/0f1111/png?text=${encodeURIComponent(product.name)}&font=lato`
          }
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="line-clamp-2 text-[14px] leading-snug text-[#0f1111] group-hover:text-[#c7511f] group-hover:underline">
        {product.name}
      </h3>
      <div className="mt-1 flex items-center gap-1.5">
        <Stars rating={rating} />
        <span className="text-[12px] text-[#007185]">
          ({count.toLocaleString()})
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="rounded bg-[#cc0c39] px-1 py-0.5 text-[11px] font-bold text-white">
          Deal
        </span>
        <span className="text-[18px] font-medium text-[#0f1111]">
          <sup className="text-[12px]">$</sup>
          {dollars}
          <sup className="text-[12px]">.{cents}</sup>
        </span>
      </div>
      <p className="text-[12px] text-[#565959]">
        List: <span className="line-through">${original.toLocaleString()}</span>
      </p>
      <p className="mt-1 text-[12px] text-[#0f1111]">
        <span className="font-bold">FREE delivery</span> tomorrow
      </p>
    </Link>
  );
}

export default function HomePage() {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const dealsRow = products.slice(0, 6);
  const recommendedRow = products.slice(6, 18);

  return (
    <div className="bg-[#eaeded]">
      <TrackPageView />

      {/* Hero gradient + content card */}
      <section className="relative">
        <div className="h-[460px] w-full bg-gradient-to-b from-[#9bb6cb] via-[#bcd4e3] to-[#eaeded]">
          <div className="mx-auto h-full max-w-[1500px] px-6">
            <div className="flex h-full items-start pt-12">
              <div className="max-w-md rounded-sm bg-white/95 p-5 shadow-sm">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#cc0c39]">
                  Up to 70% off
                </p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-[#0f1111]">
                  Spring Deal Days
                </h1>
                <p className="mt-2 text-[13px] text-[#0f1111]">
                  Save big on the brands you love — every day, only on ModnZon.
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-full bg-[#ffd814] px-5 py-1.5 text-[13px] font-medium text-[#0f1111] ring-1 ring-[#fcd200] transition hover:bg-[#f7ca00]"
                >
                  Shop deals
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pulled-up promo card grid */}
        <div className="relative -mt-44 px-2 sm:px-3">
          <div className="mx-auto max-w-[1500px]">
            <PersonalBanner />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PROMO_CATEGORIES.map((tile) => {
                const items = tile.ids
                  .map((id) => productsById.get(id))
                  .filter((p): p is Product => Boolean(p));
                return (
                  <div
                    key={tile.title}
                    className="rounded bg-white p-5 shadow-sm"
                  >
                    <h2 className="text-[18px] font-bold leading-snug text-[#0f1111]">
                      {tile.title}
                    </h2>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {items.slice(0, 4).map((it) => (
                        <PromoMini key={it.id} product={it} />
                      ))}
                    </div>
                    <Link
                      href="/"
                      className="mt-3 inline-block text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline"
                    >
                      {tile.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Deals */}
      <section className="px-2 pb-3 sm:px-3">
        <div className="mx-auto mt-3 max-w-[1500px] rounded bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[22px] font-bold text-[#0f1111]">
              Today&apos;s Deals
            </h2>
            <Link
              href="/"
              className="text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline"
            >
              See all deals
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {dealsRow.map((product) => (
              <DealCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Recommended */}
      <section className="px-2 pb-6 sm:px-3">
        <div className="mx-auto max-w-[1500px] rounded bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[22px] font-bold text-[#0f1111]">
              More items to consider
            </h2>
            <Link
              href="/"
              className="text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline"
            >
              See more
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recommendedRow.map((product) => (
              <DealCard key={`rec-${product.id}`} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
