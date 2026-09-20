# SEO audit — MAISON DÉCO

**Project type:** e-commerce / catalog (bilingual FR+EN, Morocco)
**Stack:** Next.js 16 App Router, `output: 'export'` → `out/`, served by Nginx on a VPS
**Domain:** https://maisondeco.ma — live since 20/09/2026
**Audited:** the production site, plus a local build made against the production
API so `out/` matches what Nginx serves.

**Overall: complete.** Second pass, run after the site went live and grew from
47 to 92 built pages. Six findings fixed; the remaining gap is the one the first
audit already named — the catalogue has no product photographs and no prices,
both client deliverables.

| Phase | Status | Result |
|---|---|---|
| 0 · Build & inventory | ✅ | 92 HTML pages, 76 indexable, build clean |
| 1 · Per-page meta | ✅ | titles 41–54, descriptions 142–157 chars **as served** (entities counted) |
| 1b · Targeting & internal links | ➖ | no `research/`/`content/` folders — greenfield build |
| 2 · Structured data | ✅ | **0 errors** over 148 blocks: 54 Product, 80 BreadcrumbList, 16 ItemList, 4 FAQPage, Organization+HomeGoodsStore, WebSite |
| 2c · GEO / LLM | ✅ | `llms.txt` served, 12 `User-Agent` blocks in robots.txt, Organization now carries a `logo` |
| 3 · Sitemap + robots | ✅ | 74 URLs with hreflang; robots.txt valid (verified on a second run) |
| 4 · OG image | ✅ | `og-default.png` → 200, 4.3 KB (⚠ still placeholder artwork) |
| 5 · Page weight | ✅ | home 72 KB → **15 KB gzipped**; 354 DOM nodes (Lighthouse warns >800) |
| 6 · Images | ✅ | half-size variants added — home images 415 KB → **328 KB** |
| 7 · Lighthouse | ✅ | home **97 / 100 / 100 / 100**; product **70 / 100 / 100 / 100** |
| 8 · Launch checklist | ⚠️ | GSC tag shipped, property still to verify; no prices, no product photos |

## Fixed in this pass

| Finding | Fix |
|---|---|
| **10 `ItemList` blocks shipped empty** (5 pieceless families × 2 languages) — Google rejects `itemListElement: []` | `itemListJsonLd` returns `null`; `JsonLd` renders nothing for `null` |
| **3 meta descriptions over 160 chars.** `slice(0, 158)` counted source characters, but React escapes `'` as `&#x27;` — 5 characters for 1 — so 158 shipped as 178. It also cut mid-word | `categoryMetaDescription()` measures the **escaped** string and trims on a word boundary. Protects every family written in `/admin` from now on |
| Organization had no `logo` (Google-recommended) | 512 px `logo.png` derived from `favicon.svg` by `prepare-favicon.mjs` |
| Catalogue cards loaded the 800×1000 product photo to display it 200–400 px wide | `prepare-media.mjs` writes a 400 px variant; `ProductImage` offers it via `srcSet`. **−87 KB on the home page alone** |
| `ProductImage` hardcoded 800×1000, so family photos (800×587) declared a false height | `width`/`height`/`sizes` are now props |
| Google Search Console verification | `verification.google` on both root layouts |
| `deploy.sh` aborted on `git pull`: `catalogue.json` is tracked *and* rewritten by every build, so the VPS working tree is permanently dirty | the script restores that one file before pulling — the build regenerates it anyway |

## Two Lighthouse findings that were NOT real

Both were chased to the end rather than "fixed" blindly.

- **"Enable text compression — 78 KiB"** reproduced on two runs. Three direct
  tests (HTTP/1.1, HTTP/2, exact Chrome headers) showed gzip working. Settled by
  making Nginx log the negotiation during a Lighthouse run: it received
  `gzip, deflate, br, zstd` and answered **`gzip`, ratio 3.84** — 74.8 KB sent as
  19.5 KB. Lighthouse's `transferSize` was wrong; nothing to fix.
- **"robots.txt is not valid"** on the home run — `Lighthouse was unable to
  download a robots.txt file`. The product-page run scored it 1/1 and `curl`
  returns 200. Transient fetch failure.

## Not findings

`0 <h1>` on 7 pages: the 5 `/admin/` screens (`noindex, nofollow, nocache`) and
the 2 client-rendered fallback sheets (`noindex, follow`). All are also
`Disallow`ed in robots.txt.

`Product` without `offers` on all 54 product pages: every piece is priced 0 =
"price on request". Emitting an `offers` node would mean inventing a price. No
price rich result until real prices exist — that is the honest trade.

## Measured, not assumed

- `scripts/seo-check.mjs` over all 92 built pages
- `validate-schema.mjs` (skill script, repointed to `out/`) — 148 blocks, 0 errors
- Lighthouse on production for home and a product page, before and after the image fix
- Real latency from Morocco: connect 0.08–0.13 s, **first byte 0.28–0.40 s**,
  total 0.44–0.51 s. Lighthouse's "server response time 3 280 ms" is its
  simulated 4G throttle, not the server.
- 27 catalogue images: all WebP, all with `alt`, `width`/`height` and `loading`

**On the scores.** Two runs on identical code gave Performance 47 then 57, so
run-to-run variance is wide. The byte measurements are the solid part: home
images 415 → 328 KB, total page weight 780 → 696 KB.

## Open — needs the client, not code

1. **Prices.** All 27 pieces are 0 DH. No price list exists anywhere in the
   repo; `docs/CLIENT-CHECKLIST.md` already marks this blocking.
2. **Product photographs of the tableaux.** The four `Tableau*.jpeg` sources are
   room scenes, now used as family photos. No single-piece shots exist, so the
   three tableaux families stay empty.
3. **OG share image** is still generated placeholder artwork.
4. **Search Console**: the verification tag is live — verify the property,
   submit `sitemap.xml`, request indexing for the money pages.
5. **Legal pages** (CGV, retours, mentions légales) are still unwritten.
6. **Contact form and orders notify nobody** — messages and orders land in the
   database and wait for someone to open `/admin`. No email, no SMS, no webhook.

*Last run: 20/09/2026.*
