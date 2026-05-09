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
    <div className="mx-auto w-full max-w-sm px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Just your email. No password needed for the demo.
      </p>
      <form onSubmit={(e) => { void handleSubmit(e); }} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="demo@user.com"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
