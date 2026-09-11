/**
 * SEO audit pass over the static export in out/.
 * Reads the BUILT html (entities included) — never the source.
 *   node scripts/seo-check.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const OUT = 'out';
const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith('.html')) acc.push(p);
  }
  return acc;
};

const pages = walk(OUT).sort();
const head = (html) => html.slice(0, html.indexOf('</head>') + 7);
const one = (re, s) => (s.match(re) ?? [])[1] ?? null;

const rows = [];
const problems = [];
const titles = new Map();
const descs = new Map();

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const h = head(html);
  const url = '/' + relative(OUT, file).replace(/\\/g, '/').replace(/index\.html$/, '');

  const title = one(/<title[^>]*>([^<]*)<\/title>/, h);
  const desc = one(/<meta name="description" content="([^"]*)"/, h);
  const canonical = one(/<link rel="canonical" href="([^"]*)"/, h);
  const lang = one(/<html[^>]*lang="([^"]*)"/, html);
  const ogImage = one(/<meta property="og:image" content="([^"]*)"/, h);
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  const hreflang = (h.match(/rel="alternate"/g) ?? []).length;
  // An inline <style> counts, and it may sit in the body (the 404 renders as a
  // fragment inside Next's shell), so test the whole document.
  const css = /<link[^>]+rel="stylesheet"/.test(h) || /<style[^>]*>[\s\S]*?<\/style>/.test(html);
  const robotsNoindex = /<meta name="robots" content="[^"]*noindex/.test(h);

  rows.push({ url, title, desc, canonical, lang, h1s, hreflang, css, robotsNoindex, ogImage });

  const tag = (m) => problems.push(`${url}: ${m}`);

  // Cart/checkout/404 are noindex on purpose — snippet quality is irrelevant
  // there, so don't report them as SEO findings.
  if (robotsNoindex) {
    if (!css) tag('NO STYLESHEET LINK');
    if (h1s !== 1) tag(`${h1s} <h1> (expected exactly 1)`);
    continue;
  }

  if (!title) tag('no <title>');
  else {
    if (title.length > 60) tag(`title ${title.length} chars (>60, will be truncated)`);
    if (titles.has(title)) tag(`duplicate title with ${titles.get(title)}`);
    titles.set(title, url);
  }
  if (!desc) tag('no meta description');
  else {
    if (desc.length > 160) tag(`description ${desc.length} chars (>160)`);
    if (desc.length < 70) tag(`description only ${desc.length} chars (thin)`);
    if (descs.has(desc)) tag(`duplicate description with ${descs.get(desc)}`);
    descs.set(desc, url);
  }
  if (!canonical && !url.startsWith('/404')) tag('no canonical');
  if (h1s !== 1) tag(`${h1s} <h1> (expected exactly 1)`);
  if (!lang) tag('no <html lang>');
  if (!css) tag('NO STYLESHEET LINK');
  if (!ogImage && !url.startsWith('/404')) tag('no og:image');
  if (hreflang === 0 && !url.startsWith('/404')) tag('no hreflang alternates');
}

// ---- JSON-LD ---------------------------------------------------------------
const ldProblems = [];
const typeCount = new Map();
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const url = '/' + relative(OUT, file).replace(/\\/g, '/').replace(/index\.html$/, '');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      ldProblems.push(`${url}: JSON-LD does not parse`);
      continue;
    }
    const t = Array.isArray(data['@type']) ? data['@type'].join('+') : data['@type'];
    typeCount.set(t, (typeCount.get(t) ?? 0) + 1);

    if (t === 'Product') {
      for (const f of ['name', 'sku', 'description']) if (!data[f]) ldProblems.push(`${url}: Product missing ${f}`);
      if (data.offers) {
        for (const f of ['price', 'priceCurrency', 'availability'])
          if (!data.offers[f]) ldProblems.push(`${url}: Offer missing ${f}`);
      }
      if (!data.image) ldProblems.push(`${url}: Product has no image (blocks the rich result)`);
    }
    if (t === 'ItemList') {
      for (const li of data.itemListElement ?? []) {
        if (!li.item) ldProblems.push(`${url}: ItemList ListItem uses "${Object.keys(li).filter(k=>k!=='@type'&&k!=='position'&&k!=='name')}" instead of required "item"`);
      }
    }
    if (t === 'BreadcrumbList') {
      const last = (data.itemListElement ?? []).at(-1);
      if (last && last.item) ldProblems.push(`${url}: last breadcrumb should not link to itself`);
    }
  }
}

// ---- report ----------------------------------------------------------------
console.log(`\n${pages.length} HTML pages in out/\n`);
console.log('JSON-LD types found:');
for (const [t, n] of [...typeCount].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${t}`);

const uniq = [...new Set([...problems, ...ldProblems])];
console.log(`\n${uniq.length} finding(s):\n`);
for (const p of uniq) console.log('  ✗ ' + p);
if (!uniq.length) console.log('  none');
console.log('');
