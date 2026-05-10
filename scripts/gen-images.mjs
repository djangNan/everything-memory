#!/usr/bin/env node
// Generate product images via OpenAI gpt-image-2.
// Reads each app's lib/products.ts, extracts (id, name, category, blurb),
// and writes a 1024x1024 PNG to apps/<site>/public/products/<id>.png.
// Skips files that already exist. Logs progress to stdout.
//
// Usage:  OPENAI_API_KEY=sk-... node scripts/gen-images.mjs [--site=mockple|mockzon] [--only=id1,id2] [--concurrency=4]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "true"] : [a, "true"];
  }),
);

const ONLY = args.only ? new Set(String(args.only).split(",")) : null;
const SITE_FILTER = args.site || null;
const CONCURRENCY = Math.max(1, Math.min(8, parseInt(args.concurrency || "4", 10)));
const MODEL = args.model || "gpt-image-2";
const TRANSPARENT = args.transparent === "true";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("OPENAI_API_KEY env var is required");
  process.exit(1);
}

const SITES = [
  {
    site: "mockple",
    style: "Apple-style premium product photography. Centered hero shot on a pure off-white #f5f5f7 seamless background. Soft, even studio lighting with a subtle floor reflection. Crisp focus, fine detail, photorealistic, editorial, minimal. No text, no logos, no watermarks.",
    productsPath: path.join(ROOT, "apps", "mockple", "lib", "products.ts"),
    outDir: path.join(ROOT, "apps", "mockple", "public", "products"),
  },
  {
    site: "mockzon",
    style: "Standard e-commerce product photo. Centered on a pure white background. Bright even lighting, sharp focus, photorealistic, accurate colors. The kind of photo you would see on an Amazon product listing. No text, no logos, no watermarks.",
    productsPath: path.join(ROOT, "apps", "mockzon", "lib", "products.ts"),
    outDir: path.join(ROOT, "apps", "mockzon", "public", "products"),
  },
];

function parseProducts(src) {
  // crude but reliable extraction of {id,name,category,blurb} from products.ts
  const out = [];
  const re = /\{\s*id:\s*"([^"]+)",\s*name:\s*(?:"([^"]+)"|'([^']+)'),\s*category:\s*"([^"]+)",\s*price:\s*(\d+),\s*blurb:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const id = m[1];
    const name = (m[2] ?? m[3] ?? "").replace(/\\"/g, '"').replace(/\\'/g, "'");
    const category = m[4];
    const price = Number(m[5]);
    const blurb = (m[6] ?? m[7] ?? "").replace(/\\"/g, '"').replace(/\\'/g, "'");
    out.push({ id, name, category, price, blurb });
  }
  return out;
}

function buildPrompt({ name, category, blurb, style }) {
  return [
    `Subject: ${name} (${category}). ${blurb}`,
    `Style: ${style}`,
    "Composition: 1:1 square, product fills 70-80% of the frame, centered, slight three-quarter angle.",
    "Render the product with realistic materials (metals, glass, plastics, fabrics, wood) and accurate proportions.",
    "Do NOT include any text, brand logos, model numbers, watermarks, hands, people, or stickers.",
  ].join(" \n");
}

async function generateOne({ id, name, category, blurb }, { style, outDir, site }) {
  const outPath = path.join(outDir, `${id}.png`);
  try {
    const stat = await fs.stat(outPath);
    if (stat.size > 0) {
      return { id, status: "skipped", outPath };
    }
  } catch {
    // not present, proceed
  }

  const prompt = TRANSPARENT
    ? [
        `Subject: ${name} (${category}). ${blurb}`,
        "Style: photorealistic product photography on a fully transparent background. Subject only — no floor, no shadow plate, no studio backdrop.",
        "Composition: 1:1 square, product fills 70-80% of the frame, centered, slight three-quarter angle, soft contact shadow allowed underneath.",
        "Render the product with realistic materials (metals, glass, plastics, fabrics, wood) and accurate proportions.",
        "Do NOT include any text, brand logos, model numbers, watermarks, hands, people, stickers, or background elements.",
      ].join(" \n")
    : buildPrompt({ name, category, blurb, style });
  const body = {
    model: MODEL,
    prompt,
    size: "1024x1024",
    n: 1,
    ...(TRANSPARENT
      ? { background: "transparent", output_format: "png" }
      : {}),
  };

  const t0 = Date.now();
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status} for ${site}/${id}: ${text.slice(0, 400)}`);
  }
  const json = await resp.json();
  const datum = json?.data?.[0];
  if (!datum) throw new Error(`No data in response for ${site}/${id}: ${JSON.stringify(json).slice(0,300)}`);

  let buf;
  if (datum.b64_json) {
    buf = Buffer.from(datum.b64_json, "base64");
  } else if (datum.url) {
    const r2 = await fetch(datum.url);
    if (!r2.ok) throw new Error(`Failed to download URL for ${site}/${id}`);
    buf = Buffer.from(await r2.arrayBuffer());
  } else {
    throw new Error(`Unknown response shape for ${site}/${id}`);
  }
  await fs.writeFile(outPath, buf);
  return { id, status: "ok", outPath, ms: Date.now() - t0, bytes: buf.length };
}

async function processSite(siteCfg) {
  const src = await fs.readFile(siteCfg.productsPath, "utf8");
  let products = parseProducts(src);
  if (ONLY) products = products.filter((p) => ONLY.has(p.id));
  await fs.mkdir(siteCfg.outDir, { recursive: true });

  console.log(`[${siteCfg.site}] ${products.length} products to consider`);

  const results = [];
  let cursor = 0;
  let active = 0;
  let resolveAll;
  const done = new Promise((r) => (resolveAll = r));

  const launch = () => {
    while (active < CONCURRENCY && cursor < products.length) {
      const p = products[cursor++];
      active++;
      generateOne(p, siteCfg)
        .then((res) => {
          results.push(res);
          const tag = res.status === "skipped" ? "skip" : "ok  ";
          const sz = res.bytes ? ` ${(res.bytes / 1024).toFixed(0)}KB` : "";
          const ms = res.ms ? ` ${res.ms}ms` : "";
          console.log(`[${siteCfg.site}] ${tag} ${res.id}${sz}${ms}`);
        })
        .catch((err) => {
          results.push({ id: p.id, status: "fail", error: String(err.message || err) });
          console.error(`[${siteCfg.site}] FAIL ${p.id}: ${err.message || err}`);
        })
        .finally(() => {
          active--;
          if (cursor >= products.length && active === 0) resolveAll();
          else launch();
        });
    }
  };
  if (products.length === 0) resolveAll();
  else launch();
  await done;
  return results;
}

async function main() {
  const start = Date.now();
  const allResults = [];
  for (const site of SITES) {
    if (SITE_FILTER && site.site !== SITE_FILTER) continue;
    const r = await processSite(site);
    allResults.push({ site: site.site, results: r });
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n── Summary ──");
  for (const { site, results } of allResults) {
    const ok = results.filter((r) => r.status === "ok").length;
    const skip = results.filter((r) => r.status === "skipped").length;
    const fail = results.filter((r) => r.status === "fail").length;
    console.log(`${site}: ${ok} generated, ${skip} skipped, ${fail} failed`);
    if (fail) {
      for (const r of results.filter((x) => x.status === "fail")) {
        console.log(`  - ${r.id}: ${r.error}`);
      }
    }
  }
  console.log(`Elapsed ${elapsed}s`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
