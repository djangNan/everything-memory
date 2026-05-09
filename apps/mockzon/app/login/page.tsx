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
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Just your email. No password needed for the demo.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="demo@user.com"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
