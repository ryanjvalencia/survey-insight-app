// Generates synthetic survey CSVs for size/limit testing. All data is fake.
//
//   node scripts/generate-test-csv.mjs            → test-data/survey-{10k,50k,50001}.csv
//   node scripts/generate-test-csv.mjs 2500       → test-data/survey-2500.csv
//
// Rows are deterministic (seeded) and intentionally messy so the cleaning
// step has work to do: stray whitespace, blanks, out-of-range NPS values,
// "$1,234" currency strings, and mixed date formats.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "test-data";

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEPARTMENTS = ["Sales", "Support", "Engineering", "Marketing", "Finance", "Operations", "HR"];
const REGIONS = ["North America", "Europe", "APAC", "LATAM"];
const PLANS = ["Starter", "Growth", "Business", "Enterprise"];

const POSITIVE = [
  "Great onboarding and the support team was quick to respond.",
  "Really happy with the reporting features, saves us hours each week.",
  "Excellent value for the price and easy for new staff to learn.",
  "Love the dashboard, our managers check it every morning.",
  "Helpful account manager and smooth rollout across our offices.",
];
const NEUTRAL = [
  "It does what we need, though setup took longer than expected.",
  "Decent product overall. Some features are hard to find.",
  "Works fine for our team size. Would like more export options.",
  "Pricing is okay. Documentation could be clearer in places.",
];
const NEGATIVE = [
  "Slow load times on large reports and support took days to reply.",
  "Poor mobile experience, and the billing page is confusing.",
  "Frustrating integration issues with our CRM, still not resolved.",
  "Too expensive for what we use, considering switching next quarter.",
  "Bad experience with the last update, several reports broke.",
];

function csvField(value) {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function makeRow(i, rand) {
  // NPS skewed toward promoters; ~1% out of range or non-numeric, ~2% blank.
  let nps = Math.min(10, Math.max(0, Math.round(7 + (rand() - 0.35) * 8)));
  const npsNoise = rand();
  let npsCell = String(nps);
  if (npsNoise < 0.005) npsCell = "11";
  else if (npsNoise < 0.01) npsCell = "n/a";
  else if (npsNoise < 0.03) npsCell = "";

  const rating = Math.min(5, Math.max(1, Math.round(nps / 2.2 + rand())));
  const ratingCell = rand() < 0.02 ? "" : String(rating);

  const revenue = Math.round(500 + rand() * 250000);
  const revenueCell =
    rand() < 0.3 ? `$${revenue.toLocaleString("en-US")}` : String(revenue);

  const day = new Date(Date.UTC(2026, 0, 1) + Math.floor(rand() * 240) * 86400000);
  const iso = day.toISOString().slice(0, 10);
  const [y, m, d] = iso.split("-");
  const dateCell = rand() < 0.25 ? `${m}/${d}/${y}` : iso;

  const pad = rand() < 0.05 ? "  " : "";
  const department = `${pad}${pick(rand, DEPARTMENTS)}${pad}`;

  const pool = nps >= 9 ? POSITIVE : nps >= 7 ? NEUTRAL : NEGATIVE;
  const comment = rand() < 0.15 ? "" : pick(rand, pool);

  return [
    `R${String(i + 1).padStart(6, "0")}`,
    npsCell,
    ratingCell,
    revenueCell,
    dateCell,
    department,
    pick(rand, REGIONS),
    pick(rand, PLANS),
    comment,
  ];
}

function generate(rowCount) {
  const rand = rng(20260926 + rowCount);
  const header = [
    "respondent_id",
    "nps_score",
    "satisfaction_rating",
    "annual_revenue",
    "submission_date",
    "department",
    "region",
    "plan",
    "comments",
  ];
  const lines = [header.join(",")];
  for (let i = 0; i < rowCount; i++) {
    lines.push(makeRow(i, rand).map(csvField).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

const arg = process.argv[2];
const targets = arg
  ? [[`survey-${arg}.csv`, Number(arg)]]
  : [
      ["survey-10k.csv", 10_000],
      ["survey-50k.csv", 50_000],
      ["survey-50001.csv", 50_001],
    ];

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, rows] of targets) {
  if (!Number.isInteger(rows) || rows < 1) {
    console.error(`Invalid row count: ${arg}`);
    process.exit(1);
  }
  const csv = generate(rows);
  writeFileSync(join(OUT_DIR, name), csv);
  const mb = (Buffer.byteLength(csv) / 1024 / 1024).toFixed(2);
  console.log(`${join(OUT_DIR, name)} — ${rows.toLocaleString()} rows, ${mb} MB`);
}
