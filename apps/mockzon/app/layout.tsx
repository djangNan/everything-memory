import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import EmInit from "./_em/EmInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ModnZon — everything for everyone",
  description: "ModnZon: a tiny demo marketplace for modn-profile.",
};

const SUBNAV = [
  { label: "All", icon: true },
  { label: "Today's Deals" },
  { label: "Customer Service" },
  { label: "Registry" },
  { label: "Gift Cards" },
  { label: "Sell" },
  { label: "ModnZon Basics" },
  { label: "Buy Again" },
];

const FOOTER_COLS: { title: string; items: string[] }[] = [
  {
    title: "Get to Know Us",
    items: ["Careers", "Blog", "About ModnZon", "Investor Relations", "ModnZon Devices"],
  },
  {
    title: "Make Money with Us",
    items: [
      "Sell products on ModnZon",
      "Sell on ModnZon Business",
      "Sell apps on ModnZon",
      "Become an Affiliate",
      "Advertise Your Products",
    ],
  },
  {
    title: "ModnZon Payment Products",
    items: [
      "ModnZon Business Card",
      "Shop with Points",
      "Reload Your Balance",
      "ModnZon Currency Converter",
    ],
  },
  {
    title: "Let Us Help You",
    items: [
      "ModnZon and COVID-19",
      "Your Account",
      "Your Orders",
      "Shipping Rates & Policies",
      "Returns & Replacements",
      "Help",
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script src="/em.js" defer />
      </head>
      <body className="min-h-full flex flex-col bg-[#eaeded] text-[#0f1111]">
        <EmInit />

        <header className="text-white">
          <div className="bg-[#131921]">
            <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-1.5 sm:gap-3">
              <Link
                href="/"
                className="flex items-center rounded border border-transparent px-2 py-2 hover:border-white"
              >
                <span className="text-2xl font-bold tracking-tight leading-none">
                  <span className="text-white">modn</span>
                  <span className="text-[#ff9900]">zon</span>
                  <span className="text-[#ff9900]">.</span>
                </span>
              </Link>

              <Link
                href="/"
                className="hidden flex-col rounded border border-transparent px-2 py-1 text-[12px] hover:border-white sm:flex"
              >
                <span className="text-[12px] text-[#cccccc]">Deliver to</span>
                <span className="flex items-center gap-1 text-[14px] font-bold leading-tight">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M8 0a5 5 0 0 1 5 5c0 4-5 11-5 11S3 9 3 5a5 5 0 0 1 5-5zm0 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  </svg>
                  SF 94103
                </span>
              </Link>

              <form className="flex h-10 flex-1 overflow-hidden rounded-md text-[14px] text-[#0f1111]">
                <div className="hidden items-center gap-1 bg-[#e6e6e6] px-3 text-[12px] font-medium text-[#0f1111] hover:bg-[#dadada] sm:flex">
                  All
                  <svg viewBox="0 0 10 6" className="h-2 w-2" fill="currentColor">
                    <path d="M0 0l5 6 5-6z" />
                  </svg>
                </div>
                <input
                  type="search"
                  placeholder="Search ModnZon"
                  className="flex-1 bg-white px-3 outline-none placeholder:text-[#565959] focus:ring-2 focus:ring-[#febd69]"
                />
                <button
                  type="button"
                  aria-label="Search"
                  className="flex w-12 items-center justify-center bg-[#febd69] hover:bg-[#f3a847]"
                >
                  <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="#0f1111" strokeWidth="2">
                    <circle cx="7" cy="7" r="5" />
                    <path d="m11 11 4 4" strokeLinecap="round" />
                  </svg>
                </button>
              </form>

              <div className="hidden items-center gap-3 text-[12px] sm:flex">
                <Link
                  href="/login"
                  className="rounded border border-transparent px-2 py-2 leading-tight hover:border-white"
                >
                  <span className="block text-[12px]">Hello, sign in</span>
                  <span className="flex items-center gap-1 text-[14px] font-bold">
                    Account & Lists
                    <svg viewBox="0 0 10 6" className="h-2 w-2" fill="currentColor">
                      <path d="M0 0l5 6 5-6z" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/"
                  className="rounded border border-transparent px-2 py-2 leading-tight hover:border-white"
                >
                  <span className="block text-[12px]">Returns</span>
                  <span className="block text-[14px] font-bold">&amp; Orders</span>
                </Link>
                <Link
                  href="/"
                  aria-label="Cart"
                  className="flex items-end gap-1 rounded border border-transparent px-2 py-2 hover:border-white"
                >
                  <span className="relative">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 4h2l2.4 12h11.2L21 7H7" strokeLinejoin="round" />
                      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-[14px] font-bold text-[#f08804]">
                      0
                    </span>
                  </span>
                  <span className="text-[14px] font-bold">Cart</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-[#232f3e]">
            <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1 text-[14px]">
              {SUBNAV.map((item) => (
                <Link
                  key={item.label}
                  href="/"
                  className="flex items-center gap-1 whitespace-nowrap rounded border border-transparent px-2 py-1.5 hover:border-white"
                >
                  {item.icon ? (
                    <svg viewBox="0 0 18 12" className="h-3 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0 1h18M0 6h18M0 11h18" strokeLinecap="round" />
                    </svg>
                  ) : null}
                  <span className={item.icon ? "font-bold" : ""}>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="mt-auto text-white">
          <Link
            href="#top"
            className="block bg-[#37475a] py-3 text-center text-[13px] hover:bg-[#485769]"
          >
            Back to top
          </Link>
          <div className="bg-[#232f3e]">
            <div className="mx-auto grid max-w-[1300px] gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
              {FOOTER_COLS.map((col) => (
                <div key={col.title}>
                  <p className="mb-2 text-[16px] font-bold">{col.title}</p>
                  <ul className="space-y-1.5 text-[13px] text-[#dddddd]">
                    {col.items.map((item) => (
                      <li key={item}>
                        <Link href="/" className="hover:underline">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#131a22]">
            <div className="mx-auto max-w-[1300px] px-6 py-6 text-center">
              <p className="text-[18px] font-bold tracking-tight">
                <span className="text-white">modn</span>
                <span className="text-[#ff9900]">zon</span>
              </p>
              <p className="mt-3 text-[12px] text-[#dddddd]">
                Conditions of Use &nbsp;·&nbsp; Privacy Notice &nbsp;·&nbsp;
                Interest-Based Ads &nbsp;·&nbsp; © 2026 ModnZon Demo
              </p>
              <p className="mt-1 text-[11px] text-[#999999]">
                ModnZon — modn-profile demo. Not a real Amazon site.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
