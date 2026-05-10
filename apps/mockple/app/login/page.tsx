"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("demo_email", normalized);
      await window.EM?.identify(normalized);
    }
    router.push("/");
  }

  return (
    <div className="bg-[#f5f5f7] py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[420px] px-6">
        <div className="text-center">
          <svg
            viewBox="0 0 14 17"
            fill="#1d1d1f"
            aria-hidden="true"
            className="mx-auto h-7 w-7"
          >
            <path d="M11.62 8.84c-.02-2.07 1.7-3.06 1.78-3.11-.97-1.42-2.48-1.61-3.02-1.63-1.28-.13-2.5.75-3.15.75-.66 0-1.66-.74-2.74-.72-1.41.02-2.71.82-3.43 2.08-1.46 2.54-.37 6.3 1.06 8.36.7 1.01 1.53 2.14 2.61 2.1 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.62.68 2.73.66 1.13-.02 1.85-1.03 2.55-2.04.8-1.16 1.13-2.3 1.15-2.36-.03-.01-2.2-.85-2.26-3.41zM9.69 2.81c.58-.7.97-1.68.86-2.65-.83.04-1.85.56-2.45 1.26-.54.62-1.01 1.61-.88 2.57.93.07 1.88-.47 2.47-1.18z" />
          </svg>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-4xl">
            Sign in with your ModnPle ID
          </h1>
          <p className="mt-2 text-[15px] text-[#6e6e73]">
            One ModnPle ID is all you need to access all ModnPle services.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#d2d2d7]"
        >
          <label className="block">
            <span className="text-[13px] font-medium text-[#1d1d1f]">
              ModnPle ID
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@user.com"
              autoComplete="email"
              className="mt-1.5 block w-full rounded-lg border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30"
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#0071e3] px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed]"
          >
            Continue
          </button>
          <p className="mt-6 text-center text-[13px] text-[#0071e3]">
            <a href="#" className="hover:underline">
              Forgot ModnPle ID or password?
            </a>
          </p>
          <p className="mt-2 text-center text-[13px] text-[#6e6e73]">
            Don&apos;t have a ModnPle ID?{" "}
            <a href="#" className="text-[#0071e3] hover:underline">
              Create yours now.
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
