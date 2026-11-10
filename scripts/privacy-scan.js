#!/usr/bin/env node
// Blocks commits and pushes that contain personal data. File contents are compared against private sources that
// never leave this Mac: tests/private-terms.txt, my-starter-backup.json and Amex CSVs in ~/Downloads.
//   node scripts/privacy-scan.js              staged files (pre-commit hook)
//   node scripts/privacy-scan.js <commit>...  every file of each commit (pre-push hook)
// A reviewed false positive goes in .privacy-allow.txt (gitignored), one value per line.
// ponytail: whole-pound amounts under £100 and single plain words from the backup are not checked (they are everywhere in the
// code); names and other single words belong in tests/private-terms.txt.
const { execFileSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");

const out = a => execFileSync("git", a, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
const top = out(["rev-parse", "--show-toplevel"]); // files to scan come from this tree
// Gitignored private sources live in the MAIN working tree, which a git worktree doesn't have.
let root = top;
try { root = path.dirname(out(["rev-parse", "--path-format=absolute", "--git-common-dir"])); } catch (_) {}
const git = args => execFileSync("git", args, { cwd: top, maxBuffer: 64 << 20 }).toString();
const read = f => { try { return fs.readFileSync(f, "utf8"); } catch (_) { return null; } };
const lines = text => (text || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);

const allow = new Set(lines(read(path.join(root, ".privacy-allow.txt"))).map(s => s.toLowerCase()));
const needles = new Map(); // value -> where it came from
const phrase = (v, from, min = 5) => { v = String(v || "").trim(); if (v.length >= min && !allow.has(v.toLowerCase())) needles.set(v.toLowerCase(), from); };
// Pence, £0.00 and, for £1,000+, whole pounds with and without a comma. Round amounts under £100, and multiples of £50 under £1,000, are too common to check.
const amount = (pence, from) => {
  pence = Math.abs(pence);
  if (!Number.isInteger(pence) || pence < 500 || (pence % 100 === 0 && pence < 10000) || (pence % 5000 === 0 && pence < 100000)) return;
  const forms = [(pence / 100).toFixed(2)];
  if (pence >= 1000) forms.push(String(pence)); // three-digit pence (e.g. 112) are everywhere in code
  if (pence >= 100000) forms.push(String(Math.round(pence / 100)), Math.round(pence / 100).toLocaleString("en-GB"));
  forms.forEach(v => allow.has(v) || needles.set(v, from));
};

const sources = [];
const terms = read(path.join(root, "tests/private-terms.txt"));
if (terms) { sources.push("private words"); lines(terms).filter(w => !w.startsWith("#")).forEach(w => phrase(w, "private words", 3)); }

const backup = read(path.join(root, "my-starter-backup.json"));
if (backup) {
  sources.push("backup");
  (function walk(x) {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
    else if (typeof x === "number") amount(x, "backup amount");
    else if (typeof x === "string") /^\d{4}-\d\d-\d\d$/.test(x) ? phrase(x, "backup date") : /[^a-z]/i.test(x) && phrase(x, "backup text");
  })(JSON.parse(backup));
}

const downloads = path.join(os.homedir(), "Downloads");
for (const name of (fs.existsSync(downloads) ? fs.readdirSync(downloads) : []).filter(n => n.toLowerCase().endsWith(".csv"))) {
  const rows = lines(read(path.join(downloads, name))).map(r => r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, "").trim()));
  const head = (rows[0] || []).map(h => h.toLowerCase());
  if (!head.includes("description") || !head.includes("amount")) continue; // not an Amex export
  sources.push(name);
  const col = n => head.indexOf(n);
  for (const r of rows.slice(1)) {
    (r[col("description")] || "").split(/\s{2,}/).forEach(part => phrase(part, name)); // shop, then town
    ["address", "town/city", "postcode", "card member", "account #", "reference"].forEach(n => col(n) >= 0 && phrase(r[col(n)], name));
    amount(Math.round(parseFloat(r[col("amount")]) * 100), name);
  }
}

// Files to scan: the staged snapshot, or each given commit.
const targets = process.argv.slice(2);
const files = [];
const skip = f => /(^|\/)package-lock\.json$/.test(f);
if (!targets.length) git(["ls-files", "--cached"]).split("\n").filter(Boolean).filter(f => !skip(f)).forEach(f => files.push([f, () => git(["show", ":" + f])]));
else for (const sha of targets) git(["ls-tree", "-r", "--name-only", sha]).split("\n").filter(Boolean).filter(f => !skip(f)).forEach(f => files.push([sha.slice(0, 7) + ":" + f, () => git(["show", sha + ":" + f])]));
for (const sha of targets) files.push([sha.slice(0, 7) + ":message", () => git(["log", "-1", "--format=%B", sha])]);

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Whole words only, so a town like "Arch" doesn't match "search"; "target" in e.target still needs the allowlist.
const patterns = [...needles].map(([v, from]) => [v, from, /^[\d.,]+$/.test(v) ? new RegExp("(?<![\\d.])" + escape(v) + "(?!\\d)") : new RegExp("(?<![a-z0-9])" + escape(v) + "(?![a-z0-9])", "i")]);
const hits = [];
for (const [label, load] of files) {
  load().split("\n").forEach((line, i) => {
    if (line.includes("base64,")) return; // embedded font data
    const joined = line.replace(/["'`]\s*\+\s*["'`]/g, ""); // "ab" + "cd" is checked as "abcd"
    for (const [v, from, re] of patterns) if (re.test(line) || re.test(joined)) hits.push(`${label}:${i + 1}  "${v}"  (from ${from})`);
  });
}

if (!sources.length) console.error("privacy-scan: no private sources found; nothing to compare against.");
if (hits.length) {
  console.error(`privacy-scan: BLOCKED. ${hits.length} match(es) with your private data:\n  ` + [...new Set(hits)].join("\n  "));
  console.error("Replace them with made-up values. Only a value that is genuinely generic belongs in .privacy-allow.txt.");
  process.exit(1);
}
console.log(`privacy-scan: clean (${files.length} files checked against ${sources.join(", ") || "nothing"}).`);
