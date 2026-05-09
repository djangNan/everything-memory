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
  title: "Everything Memory — Admin",
  description: "Ask any question about your users in plain English.",
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="bg-slate-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-base font-semibold">
              <span className="rounded bg-emerald-400 px-1.5 py-0.5 text-xs font-bold text-slate-900">
                EM
              </span>
              <span>Everything Memory</span>
              <span className="ml-2 text-xs font-normal text-slate-400">
                Admin
              </span>
            </Link>
            <nav className="text-sm text-slate-300">
              <Link href="/" className="hover:text-white">
                Site
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          Everything Memory · for site owners and AI agents
        </footer>
      </body>
    </html>
  );
}
