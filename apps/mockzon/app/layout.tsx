import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MockZon — everything for everyone",
  description: "MockZon: a tiny demo marketplace for Everything Memory.",
};

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
      <body className="min-h-full flex flex-col bg-[#fffaf3] text-zinc-900">
        <header className="bg-zinc-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-orange-400">Mock</span>
              <span>Zon</span>
            </Link>
            <div className="hidden flex-1 px-8 sm:block">
              <input
                type="search"
                placeholder="Search MockZon"
                className="w-full rounded-md border border-transparent bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-orange-300">
                Home
              </Link>
              <Link href="/login" className="hover:text-orange-300">
                Sign in
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
          MockZon — Everything Memory demo. Not a real Amazon site.
        </footer>
      </body>
    </html>
  );
}
