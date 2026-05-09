import type { Metadata } from "next";
import Link from "next/link";
import AskUser from "../../components/AskUser";

type Params = { hash: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hash } = await params;
  return {
    title: `User ${hash.slice(0, 8)}… — EM Admin`,
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { hash } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">User</h1>
      <p className="mt-1 break-all font-mono text-xs text-slate-500">
        user_hash: {hash}
      </p>
      <div className="mt-8">
        <AskUser userHash={hash} />
      </div>
    </div>
  );
}
