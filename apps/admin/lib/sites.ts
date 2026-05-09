export type Site = {
  id: string;
  apiKey: string;
  name: string;
};

export const sites: Site[] = [
  {
    id: "mockple",
    apiKey: "mockple_key_demo_2026",
    name: "MockPle Store",
  },
  {
    id: "mockzon",
    apiKey: "mockzon_key_demo_2026",
    name: "MockZon Marketplace",
  },
];

export function getSite(id: string): Site | undefined {
  return sites.find((s) => s.id === id);
}
