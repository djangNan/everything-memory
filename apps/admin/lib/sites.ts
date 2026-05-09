export type SiteId = "mockple" | "mockzon";

export type Site = {
  id: SiteId;
  apiKey: string;
  name: string;
};

// Public demo keys — safe to expose; fall back only if env unset.
const MOCKPLE_KEY =
  process.env.NEXT_PUBLIC_MOCKPLE_KEY || "mockple_key_demo_2026";
const MOCKZON_KEY =
  process.env.NEXT_PUBLIC_MOCKZON_KEY || "mockzon_key_demo_2026";

export const SITES: Record<SiteId, Site> = {
  mockple: {
    id: "mockple",
    apiKey: MOCKPLE_KEY,
    name: "MockPle Store",
  },
  mockzon: {
    id: "mockzon",
    apiKey: MOCKZON_KEY,
    name: "MockZon Marketplace",
  },
};

export const SITE_IDS: SiteId[] = ["mockple", "mockzon"];

export const sites: Site[] = SITE_IDS.map((id) => SITES[id]);

export function getSite(id: string): Site | undefined {
  return (SITES as Record<string, Site>)[id];
}

export function isSiteId(value: string): value is SiteId {
  return value === "mockple" || value === "mockzon";
}

export function resolveSiteId(value: string | undefined | null): SiteId {
  return value && isSiteId(value) ? value : "mockple";
}
