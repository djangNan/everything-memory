import Link from "next/link";
import type { Product } from "@/lib/products";
import { products } from "@/lib/products";
import TrackPageView from "./_em/TrackPageView";

type TileSize = "hero" | "tile" | "wide";
type TileVariant = "light" | "dark";

function Tile({
  product,
  variant,
  size,
  eyebrow = "New",
}: {
  product: Product;
  variant: TileVariant;
  size: TileSize;
  eyebrow?: string;
}) {
  const dark = variant === "dark";
  const surface = dark ? "bg-[#1d1d1f] text-[#f5f5f7]" : "bg-[#f5f5f7] text-[#1d1d1f]";
  const eyebrowColor = dark ? "text-[#86868b]" : "text-[#6e6e73]";
  const blurbColor = dark ? "text-[#a1a1a6]" : "text-[#1d1d1f]/80";

  const headline =
    size === "hero"
      ? "text-5xl sm:text-7xl"
      : size === "wide"
      ? "text-4xl sm:text-6xl"
      : "text-3xl sm:text-5xl";
  const tagline =
    size === "hero"
      ? "text-xl sm:text-2xl"
      : size === "wide"
      ? "text-lg sm:text-xl"
      : "text-base sm:text-xl";
  const padTop = size === "hero" ? "pt-14 sm:pt-20" : "pt-12 sm:pt-16";
  const imgMax = size === "hero" ? "max-h-[460px]" : size === "wide" ? "max-h-[360px]" : "max-h-[300px]";

  const swatch = dark ? "1d1d1f" : "f5f5f7";
  const ink = dark ? "f5f5f7" : "1d1d1f";

  return (
    <Link
      href={`/p/${product.id}`}
      className={`group relative flex flex-col items-center overflow-hidden ${surface} ${padTop} text-center`}
    >
      <p className={`text-[12px] font-medium uppercase tracking-[0.18em] ${eyebrowColor}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-2 px-6 font-semibold tracking-tight ${headline}`}>
        {product.name}
      </h2>
      <p className={`mt-3 max-w-2xl px-6 font-medium tracking-tight ${blurbColor} ${tagline}`}>
        {product.blurb}
      </p>
      <p className={`mt-3 text-[13px] ${eyebrowColor}`}>
        From ${product.price.toLocaleString()}
      </p>
      <div className="mt-5 flex items-center gap-6 text-sm sm:text-base">
        <span className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-5 py-2 font-medium text-white transition group-hover:bg-[#0077ed]">
          Buy
        </span>
        <span className="text-[#2997ff] font-medium transition group-hover:underline">
          Learn more &rsaquo;
        </span>
      </div>
      <div className="mt-8 w-full flex-1 px-6 pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            product.image ??
            `https://placehold.co/1200x900/${swatch}/${ink}/png?text=${encodeURIComponent(product.name)}&font=lora`
          }
          alt={product.name}
          className={`mx-auto h-full ${imgMax} w-auto object-contain`}
        />
      </div>
    </Link>
  );
}

function GridCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/p/${product.id}`}
      className="group flex flex-col rounded-2xl bg-[#f5f5f7] p-4 text-[#1d1d1f] transition hover:shadow-md"
    >
      <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            product.image ??
            `https://placehold.co/400x400/f5f5f7/1d1d1f/png?text=${encodeURIComponent(product.name)}`
          }
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#6e6e73]">
        {product.category}
      </p>
      <h3 className="mt-1 line-clamp-2 text-sm font-medium tracking-tight group-hover:underline">
        {product.name}
      </h3>
      <p className="mt-2 text-sm font-semibold">
        ${product.price.toLocaleString()}
      </p>
    </Link>
  );
}

export default function HomePage() {
  const [hero, a, b, c, d, e, ...rest] = products;
  return (
    <div className="bg-white">
      <TrackPageView />
      {hero && <Tile product={hero} variant="light" size="hero" eyebrow="New" />}
      {a && b && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Tile product={a} variant="dark" size="tile" eyebrow="New" />
          <Tile product={b} variant="light" size="tile" eyebrow="Magical" />
        </div>
      )}
      {c && d && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Tile product={c} variant="light" size="tile" eyebrow="Now playing" />
          <Tile product={d} variant="dark" size="tile" eyebrow="Adventure" />
        </div>
      )}
      {e && (
        <div className="mt-2">
          <Tile product={e} variant="light" size="wide" eyebrow="Hello (again)" />
        </div>
      )}
      {rest.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Shop the lineup.
            </h2>
            <p className="text-sm text-[#6e6e73]">
              {products.length} products
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rest.map((product) => (
              <GridCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
