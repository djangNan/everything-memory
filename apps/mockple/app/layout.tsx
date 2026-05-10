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
  title: "ModnPle — premium gadgets",
  description: "ModnPle: a tiny demo storefront for modn-profile.",
};

const NAV_LINKS = [
  "Store",
  "Mac",
  "iPad",
  "iPhone",
  "Watch",
  "AirPods",
  "TV & Home",
  "Support",
];

const FOOTER_COLS: { title: string; items: string[] }[] = [
  {
    title: "Shop and Learn",
    items: ["Store", "Mac", "iPad", "iPhone", "Watch", "AirPods", "Accessories"],
  },
  {
    title: "Account",
    items: ["Manage Your ModnPle ID", "ModnPle Store Account", "iCloud.modnple"],
  },
  {
    title: "ModnPle Store",
    items: ["Find a Store", "Genius Bar", "Order Status", "Shopping Help"],
  },
  {
    title: "About ModnPle",
    items: ["Newsroom", "ModnPle Leadership", "Career Opportunities", "Contact ModnPle"],
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
      <body className="min-h-full flex flex-col bg-white text-[#1d1d1f]">
        <EmInit />
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[rgba(22,22,23,0.72)] text-[#f5f5f7]">
          <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-5 text-[12px] font-normal">
            <Link
              href="/"
              className="flex items-center gap-1.5 transition hover:opacity-100 opacity-90"
              aria-label="ModnPle home"
            >
              <svg
                viewBox="0 0 14 17"
                fill="currentColor"
                aria-hidden="true"
                className="h-3.5 w-3.5"
              >
                <path d="M11.62 8.84c-.02-2.07 1.7-3.06 1.78-3.11-.97-1.42-2.48-1.61-3.02-1.63-1.28-.13-2.5.75-3.15.75-.66 0-1.66-.74-2.74-.72-1.41.02-2.71.82-3.43 2.08-1.46 2.54-.37 6.3 1.06 8.36.7 1.01 1.53 2.14 2.61 2.1 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.62.68 2.73.66 1.13-.02 1.85-1.03 2.55-2.04.8-1.16 1.13-2.3 1.15-2.36-.03-.01-2.2-.85-2.26-3.41zM9.69 2.81c.58-.7.97-1.68.86-2.65-.83.04-1.85.56-2.45 1.26-.54.62-1.01 1.61-.88 2.57.93.07 1.88-.47 2.47-1.18z" />
              </svg>
              <span className="sr-only">ModnPle</span>
            </Link>
            <nav className="hidden flex-1 items-center justify-center gap-7 text-[12px] sm:flex">
              {NAV_LINKS.map((label) => (
                <Link
                  key={label}
                  href="/"
                  className="opacity-80 transition hover:opacity-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-5 opacity-80">
              <button
                aria-label="Search modnple.com"
                type="button"
                className="transition hover:opacity-100"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="7" cy="7" r="5" />
                  <path d="m11 11 3 3" strokeLinecap="round" />
                </svg>
              </button>
              <Link href="/login" aria-label="Bag" className="transition hover:opacity-100">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M3 5h10l-.8 9H3.8L3 5z" strokeLinejoin="round" />
                  <path d="M6 5a2 2 0 0 1 4 0" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="bg-[#f5f5f7] text-[12px] leading-5 text-[#6e6e73]">
          <div className="mx-auto max-w-5xl px-5 pt-9 pb-6">
            <p className="border-b border-[#d2d2d7] pb-4">
              More ways to shop:{" "}
              <Link href="/" className="text-[#0071e3] hover:underline">
                Find a ModnPle Store
              </Link>{" "}
              or{" "}
              <Link href="/" className="text-[#0071e3] hover:underline">
                other retailer
              </Link>{" "}
              near you. Or call 1-800-MY-MODNPLE.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
              {FOOTER_COLS.map((col) => (
                <div key={col.title}>
                  <p className="mb-2 font-semibold text-[#1d1d1f]">{col.title}</p>
                  <ul className="space-y-1.5">
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
            <div className="mt-9 flex flex-col gap-2 border-t border-[#d2d2d7] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p>Copyright © 2026 ModnPle Inc. All rights reserved.</p>
              <p className="text-[11px]">
                ModnPle — modn-profile demo. Not a real Apple site.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
