// D1.4 — Nia indexing helper. Currently a NO-OP stub.
//
// Per CONTEXT.md §6 + d-spec.md D0.2/D1.3 we run in fallback-LLM mode:
// /profile/query asks the InsForge AI gateway with the event log inline.
// Nia stays opt-in and is only useful for the demo seed (T+2:50, 1–2 users)
// where the "11.3% hallucination reduction" line lands.
//
// To re-enable: implement upsertProfile against POST https://apigcp.trynia.ai/v2/sources
// (universal source endpoint, type: "documentation" with a markdown body).
// Until then keep the import path stable so events.ts can call this fire-and-forget.

export type EventRow = {
  event_type: string;
  site_id: string;
  properties: Record<string, unknown>;
  occurred_at: string;
};

export async function upsertProfile(_userHash: string): Promise<void> {
  // intentionally empty — fallback-LLM mode is authoritative
  return;
}

export function buildProfileMarkdown(userHash: string, events: EventRow[]): string {
  const lines = events.map((e) => {
    const ts = new Date(e.occurred_at).toISOString();
    const summary = JSON.stringify(e.properties);
    return `- [${ts}] **${e.site_id}**: ${e.event_type} ${summary}`;
  });
  return `# User Profile: ${userHash.slice(0, 8)}…\n\n## Events\n${lines.join('\n')}\n`;
}
