// One-time migration: uploads every image referenced by the portfolio tables
// to the public `portfolio` bucket, then rewrites the rows to the public URL.
//
// Run (needs your admin login — never stored anywhere):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/upload-portfolio-assets.mjs
//
// Idempotent: rows already holding an http(s) URL are skipped, uploads upsert.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";

const root = resolve(import.meta.dirname, "..");

// Minimal .env.local reader — no dotenv dependency.
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!URL_ || !ANON) throw new Error(".env.local missing Supabase config");
if (!EMAIL || !PASSWORD) {
  console.error("Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/upload-portfolio-assets.mjs");
  process.exit(1);
}

const supabase = createClient(URL_, ANON);
const BUCKET = "portfolio";

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

// table -> image columns to migrate.
const TARGETS = [
  { table: "experiences", columns: ["logo"] },
  { table: "education_items", columns: ["logo"] },
  { table: "projects", columns: ["logo"] },
  { table: "personal_projects", columns: ["logo"] },
  { table: "archive_items", columns: ["logo", "image"] },
];

const uploaded = new Map(); // local path -> public URL

async function publicUrlFor(localPath) {
  if (uploaded.has(localPath)) return uploaded.get(localPath);

  const file = resolve(root, "public", localPath.replace(/^\//, ""));
  if (!existsSync(file)) {
    console.warn(`  ⚠ missing local file, left as-is: ${localPath}`);
    uploaded.set(localPath, null);
    return null;
  }
  const key = localPath.replace(/^\//, ""); // keep folder structure
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, readFileSync(file), {
      contentType: MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
      upsert: true,
    });
  if (error) throw new Error(`upload ${key}: ${error.message}`);

  const url = supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  uploaded.set(localPath, url);
  console.log(`  ↑ ${localPath} → ${url}`);
  return url;
}

const { error: authErr } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (authErr) throw new Error(`sign-in failed: ${authErr.message}`);
console.log(`Signed in as ${EMAIL}`);

let changed = 0;
for (const { table, columns } of TARGETS) {
  console.log(`\n${table}:`);
  const { data: rows, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);

  for (const row of rows ?? []) {
    const patch = {};
    for (const col of columns) {
      const v = row[col];
      if (typeof v === "string" && v.startsWith("/")) {
        const url = await publicUrlFor(v);
        if (url) patch[col] = url;
      }
    }
    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await supabase.from(table).update(patch).eq("id", row.id);
      if (upErr) throw new Error(`${table} update ${row.id}: ${upErr.message}`);
      changed++;
    }
  }
}

await supabase.auth.signOut();
console.log(
  `\nDone: ${[...uploaded.values()].filter(Boolean).length} images uploaded, ${changed} rows updated.`,
);
