#!/usr/bin/env node
// Keeps the Content-Security-Policy in index.html tied to the app's one inline script: script-src allows that script by
// its SHA-256 hash and nothing else, so injected markup cannot run code.
//   node scripts/csp.js                   rewrite the hash in index.html (the pre-commit hook does this)
//   node scripts/csp.js --check           exit 1 if the hash does not match the script
//   node scripts/csp.js --private <file>  write a copy with script-src 'unsafe-inline' (for a host that injects scripts)
const fs = require("fs"), path = require("path"), crypto = require("crypto");

const file = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(file, "utf8");
const die = msg => { console.error("csp: " + msg); process.exit(1); };

// Exactly one inline script, no external ones, no inline event handlers in the static HTML.
const scripts = html.match(/<script[\s>]/gi) || [];
if (scripts.length !== 1 || /<script[^>]*\ssrc\s*=/i.test(html)) die("expected exactly one inline <script> and no <script src>");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) die("the <script> tag must have no attributes");
if (/\son[a-z]+\s*=/i.test(html.replace(m[0], ""))) die("inline on...= handler attributes are not allowed");

const hash = "'sha256-" + crypto.createHash("sha256").update(m[1]).digest("base64") + "'";
const rule = /(script-src )[^;"]*/;
if (!rule.test(html)) die("no script-src in the Content-Security-Policy");
const arg = process.argv[2];
const withPolicy = value => html.replace(rule, (_, k) => k + value);

if (arg === "--check") {
  if (!html.includes("script-src " + hash + ";")) die("script-src does not match the script; run node scripts/csp.js");
} else if (arg === "--private") {
  if (!process.argv[3]) die("--private needs an output file");
  fs.writeFileSync(process.argv[3], withPolicy("'unsafe-inline'"));
} else if (!arg) {
  const next = withPolicy(hash);
  if (next !== html) fs.writeFileSync(file, next);
} else die("unknown option " + arg);
