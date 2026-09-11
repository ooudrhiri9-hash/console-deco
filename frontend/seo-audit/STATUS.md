# SEO audit — ATELIER OMAR

**Project type:** e-commerce / catalog (bilingual FR+EN, Morocco)
**Stack:** Next.js 16 App Router, `output: 'export'` → `out/`
**Audited:** the built export, served with production-like headers (gzip +
Cache-Control mirroring `.htaccess`), not the source.

**Overall: complete.** 79 findings → 22, and all 22 remaining share one cause:
the catalogue has no product photographs yet (client deliverable).

| Phase | Status | Result |
|---|---|---|
| 0 · Build & inventory | ✅ | 48 routes, 47 HTML pages, build clean |
| 1 · Per-page meta | ✅ | unique titles/descriptions, canonicals, hreflang, OG on every indexable page |
| 1b · Targeting & internal links | ➖ | no `research/`/`content/` folders — greenfield build, not from the template |
| 2 · Structured data | ✅ | Organization+HomeGoodsStore, WebSite, 22 Product, 12 ItemList, 42 BreadcrumbList |
| 2c · GEO / LLM | ✅ | `llms.txt` shipped; 11 AI crawlers explicitly allowed in `robots.txt` |
| 3 · Sitemap + robots | ✅ | 40 URLs with hreflang alternates; cart/checkout/api disallowed |
| 4 · OG image | ✅ | `og-default.png` exists (⚠ placeholder artwork) |
| 5 · Page weight | ✅ | 60 KB HTML → 10.7 KB gzipped; CLS 0 |
| 6 · Images | ⚠️ | **no product photos exist yet** — blocked on the client |
| 7 · Lighthouse | ✅ | product 94 · home 86–97 (TBT jitter) · A11y 100 · BP 100 · SEO 100 |
| 8 · Launch checklist | ⚠️ | code-side done; hosting/GSC/real data still open |

## Fixed during the audit

| Finding | Fix |
|---|---|
| `ItemList` `ListItem` used `url` — Google requires `item`, so all 12 listings were silently ignored | `src/lib/seo.tsx` |
| 22 product descriptions were 29–63 chars (thin snippets) | composed from short description + material + dimensions + delivery → 120–158 chars |
| `/produits/consoles/` and `/en/products/consoles/` shipped an identical `<title>` ("Consoles" is the same word in both languages) | `categoryMetaTitle()` adds a locale-specific descriptor |
| Home title 68 chars, description 184 chars (`&` ships as `&amp;`, +4) | reworded; measured on the built HTML, entities included |
| `404.html` was Next's default page — unstyled, no `lang`, wrong copy | self-contained bilingual 404 with inline CSS + `postbuild.mjs` adds `lang` |
| `<Link>` prefetch 404s flooding the console (no RSC payload exists in a static export) | `components/Link.tsx` wrapper defaults `prefetch={false}` |
| 4 WCAG AA contrast failures: brass eyebrow 3.31, faint meta 3.39, white-on-WhatsApp-green 3.09, terracotta 4.45 | separate text tokens (`--brass-text` 5.53, `--terracotta-text` 5.71, `--whatsapp-btn` 5.22); bright accents kept for borders and the icon-only FAB |
| "Fabriqué sur commande" badge 3.33 | `--sage` darkened to 5.55 |
| Footer `<h4>` after an `<h2>` skipped a level (`heading-order`) | footer column titles are now `<h2>` |
| **Header overflowed the viewport at 320/360/375 px on every page** (wordmark + lang switch + 2 icon buttons measured 412 px) — horizontal scroll site-wide | `@media (max-width: 480px)` shrinks the wordmark and controls; wordmark can truncate |

Accessibility went 94 → **100** and the overflow bug is gone at all 15 widths tested.

## Verified, not assumed

- `scripts/seo-check.mjs` — meta/canonical/hreflang/JSON-LD over all 47 built pages
- `scripts/test-cart.mjs` — **10/10**: add to cart, quantity, badge, persistence
  across navigation, cart total (14 700 DH), WhatsApp order message, FR→EN
  switch mapping `/produits/tables-basses/` → `/en/products/coffee-tables/`
- `scripts/test-responsive.mjs` — 8 templates × 15 widths, **no horizontal
  overflow anywhere**
- Lighthouse on home + product page, against a gzip/cache-enabled server

## Re-verified after the white redesign (fonts + palette)

Typography moved to **Marcellus** (titling serif) + **Jost** (geometric sans),
and the ground moved from bone `#f7f4ef` to **white**. Every token was
re-derived and re-measured against `#ffffff`, not carried over:

| Token | on white | note |
|---|---|---|
| `--ink-soft` #57534c | 7.64 | body copy |
| `--ink-faint` #6d6862 | 5.52 | meta / captions |
| `--brass-text` #7a5a22 | 6.34 | eyebrows, wordmark |
| `--terracotta-text` #9d4630 | 6.26 | sale badge ground (white text) |
| `--sage` #5a6650 | 6.08 | made-to-order badge |
| `--brass` #a67c34 | 3.78 | **decorative only** — rules, underlines, focus ring |

Re-ran after the change: SEO 22 findings (unchanged, still only the missing
photos) · cart **10/10** · responsive **no overflow** at 8 templates × 15 widths ·
contrast **PASS**, Accessibility **100**, CLS **0**.

One regression found and fixed in the same pass: declaring the `latin-ext`
subset cost two extra preloaded font files (~35 KB) and pushed FCP 0.8 s → 1.5 s.
next/font preloads *every* subset listed, and Google's `latin` range already
covers all French accents including the `œ` ligature (U+0152-0153). Dropping it
restored FCP to 0.9–1.3 s.

## Open — cannot be closed from the codebase

1. **Product photographs.** The only remaining audit finding (22×). Without
   images the `Product` rich result cannot appear in Google.
2. **Real identity** — brand name, domain, phone, WhatsApp, e-mail, address are
   placeholders in `src/config/site.ts`. Canonicals and JSON-LD point at
   `atelier-omar.ma`.
3. **OG share image** is a generated placeholder; replace with a real 1200×630.
4. **Search Console** — property to verify, sitemap to submit, money pages to
   request indexing. Requires the live domain.
5. **`api/order.php` mail delivery** can only be tested on the real host.
6. **Legal pages** (CGV, retours, mentions légales) are not written — required
   in Morocco for online sales and a ranking/trust factor.
7. **Reviews.** All three competitors show ratings. Once real reviews exist, add
   the block plus `AggregateRating` to earn stars in the SERP.

## Not applicable

- **hreflang beyond FR/EN** — only two languages.
- **Faceted-nav crawl control** — category filters are plain links to indexable
  category pages; there are no filter/sort URL parameters to canonicalize.
- **Pagination** — 11 products; no category needs it yet. Revisit past ~50 per
  category.
