import type { Metadata } from "next";
import Link from "next/link";
import AskUser from "../../components/AskUser";
import SiteSelector from "../../components/SiteSelector";
import { SITES, resolveSiteId } from "@/lib/sites";

type Params = { hash: string };
type Search = { site?: string | string[] };

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

function pickSiteParam(raw: Search["site"]): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { hash } = await params;
  const sp = await searchParams;
  const siteId = resolveSiteId(pickSiteParam(sp.site));
  const site = SITES[siteId];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">User</h1>
          <p className="mt-1 break-all font-mono text-xs text-slate-500">
            user_hash: {hash}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Asking as <span className="font-semibold">{site.name}</span>
          </p>
        </div>
        <SiteSelector currentSite={siteId} userHash={hash} />
      </div>

      <div className="mt-8">
        <AskUser userHash={hash} apiKey={site.apiKey} />
      </div>
    </div>
  );
}
