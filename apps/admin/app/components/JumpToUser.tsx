"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function JumpToUser() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      const isHashLike = /^[a-f0-9]{64}$/i.test(trimmed);
      const hash = isHashLike
        ? trimmed.toLowerCase()
        : await sha256Hex(trimmed.toLowerCase());
      router.push(`/users/${hash}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          Open a user
        </span>
        <span className="ml-2 text-xs text-slate-500">
          email or 64-char SHA-256 hash
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="demo@user.com"
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />
      </label>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Hashing…" : "Open"}
        </button>
      </div>
    </form>
  );
}
