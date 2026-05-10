"use client";

import Link from "next/link";
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
    <div className="bg-white pb-10">
      <div className="mx-auto w-full max-w-[360px] px-4 pt-6">
        <div className="text-center">
          <Link href="/" className="inline-block text-2xl font-bold tracking-tight">
            <span className="text-[#0f1111]">modn</span>
            <span className="text-[#ff9900]">zon</span>
            <span className="text-[#ff9900]">.</span>
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="mt-4 rounded-md border border-[#dddddd] bg-white p-5"
        >
          <h1 className="text-[28px] font-medium leading-none text-[#0f1111]">
            Sign in
          </h1>
          <label className="mt-4 block text-[13px] font-bold text-[#0f1111]">
            Email or mobile phone number
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@user.com"
              autoComplete="email"
              className="mt-1 block w-full rounded border border-[#a6a6a6] bg-white px-2 py-1.5 text-[13px] text-[#0f1111] outline-none transition focus:border-[#e77600] focus:ring-2 focus:ring-[#e77600]/40"
            />
          </label>
          <button
            type="submit"
            className="mt-4 block w-full rounded bg-[#ffd814] px-3 py-1.5 text-[13px] text-[#0f1111] ring-1 ring-[#fcd200] transition hover:bg-[#f7ca00]"
          >
            Continue
          </button>
          <p className="mt-3 text-[12px] leading-snug text-[#0f1111]">
            By continuing, you agree to ModnZon&apos;s{" "}
            <a href="#" className="text-[#007185] hover:text-[#c7511f] hover:underline">
              Conditions of Use
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#007185] hover:text-[#c7511f] hover:underline">
              Privacy Notice
            </a>
            .
          </p>
          <p className="mt-3 text-[12px] text-[#007185]">
            <a href="#" className="hover:text-[#c7511f] hover:underline">
              ▸ Need help?
            </a>
          </p>
        </form>

        <div className="my-5 flex items-center text-[12px] text-[#767676]">
          <hr className="flex-1 border-[#e7e7e7]" />
          <span className="px-2">New to ModnZon?</span>
          <hr className="flex-1 border-[#e7e7e7]" />
        </div>

        <button
          type="button"
          className="block w-full rounded border border-[#a6a6a6] bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] px-3 py-1.5 text-[13px] text-[#0f1111] hover:from-[#f0f3f5]"
        >
          Create your ModnZon account
        </button>
      </div>
    </div>
  );
}
