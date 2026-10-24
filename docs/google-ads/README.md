# Google Ads: campagne Search « Consoles »

Landing page: https://maisondeco.ma/produits/consoles/

## Structure

| Item | Value |
|---|---|
| Campagne | `Search \| Consoles \| Casablanca \| FR`, Search only (no Display, no search partners) |
| Zone | **Casablanca** (city) to start. Option: **Presence: people in or regularly in** (set it by hand). Extend to all of Morocco once the campaign is profitable |
| Horaires | Every day **07:00 → 00:00** (Casablanca time), set by hand in Editor (see below) |
| Langues | Français + Arabe |
| Budget | 150 MAD/day to start (change it in `build_ads.py`) |
| Enchères | Maximize clicks, CPC capped at 4 MAD, for 2–3 weeks → then **Maximize conversions** once you have 15+ conversions/month |
| Groupes | 6 thematic groups: Entrée, Design, Artisanale, Rangement, Sur mesure, Casablanca |
| Mots-clés | 70 keywords in **Phrase + Exact** (no Broad until conversions are tracked) |
| Négatifs | 185 at campaign level. The biggest risk: "console" = **video game console** (PS5, Xbox…) |
| Annonces | 1 RSA per group (15 headlines, 4 descriptions) |
| Composants | 6 sitelinks, 8 callouts, 1 structured snippet "Styles" |

## Import into Google Ads Editor (in this order)

1. **Account → Import → From file…**, choose `1-campagne-et-groupes.csv` → *Review changes* → *Keep*.
2. Do the same with `2-ciblage-geographique.csv`, `3-mots-cles-et-negatifs.csv`, then `4-annonces-rsa.csv`.
3. `5a/5b/5c` (assets): import them the same way. If Editor doesn't map a column,
   fix the mapping in the preview, or add them by hand under *Assets*.
4. Check by hand in Editor:
   - Campaign → *Locations*: **Casablanca, Casablanca-Settat, Morocco** (if the import fails:
     *Add* → search "Casablanca" → choose the **City**), plus the **Presence** option
   - Campaign → *Ad schedule* → *Add* → 7 rows, Monday to Sunday, **07:00 to 00:00**
     (in Editor, 00:00 at the end = midnight)
   - *Networks*: uncheck *Search partners* and *Display*
   - Add a **call** asset: +212 6 65 20 24 95 (Mon–Sat 9am–7pm)
   - Add a **price** asset: Console 140 cm 3,550 DH / 150 cm 4,450 DH / 160 cm 5,350 DH
   - Add 4+ **images** (product photos, 1:1 and 1.91:1)
5. **Post** → the campaign is uploaded in **Paused** state. Enable it once conversion tracking works.

## Conversion tracking (in place)

Google tag `AW-18535074117` on the whole public site (`frontend/src/lib/gtag.ts`):
- **Commande**: primary, sent when the order is confirmed, with value and reference
- **Clic WhatsApp** and **Clic téléphone**: secondary, on every link on the site

In Goals → Summary, **only Purchase** should be "Account-default".

## Weekly optimisation

- **Search terms** report: anything off-target → add a negative (expect lots of gaming at first).
- Pause keywords with 0 conversions after about 300 MAD spent.
- Keep the RSAs at "Good"/"Excellent" Ad strength; replace headlines rated "Low".
- After about 30 conversions: switch to Maximize conversions, then tCPA; test Broad match + Smart Bidding in a separate ad group.
- Next step: a **Remarketing / Performance Max** campaign with a product feed (Merchant Center).

Keyword volumes and CPCs are not included here: check them in **Keyword Planner**
(Tools → Keyword Planner → paste the keywords, Morocco, French + Arabic).

To regenerate the CSVs after a change: `python docs/google-ads/build_ads.py`.
