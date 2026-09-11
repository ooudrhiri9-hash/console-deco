import { Jost, Marcellus } from 'next/font/google';

/**
 * Typography chosen for what the shop actually sells: art furniture and wall art.
 *
 * Marcellus — an inscriptional Roman face, the lettering of museum labels and
 * gallery plates. It gives product names ("Console Atlas") the weight of a
 * catalogue entry rather than a price tag. Titling face, one weight (400),
 * which is all the headings use.
 *
 * Jost — a geometric sans in the Futura lineage: the typographic language of
 * modernist furniture design, from the Bauhaus onward. It is the right voice
 * for specs, prices and navigation, and it keeps the page contemporary where
 * the serif alone would read as merely antique.
 *
 * Both are self-hosted at build time by next/font — no runtime request to
 * Google, no render-blocking third-party stylesheet.
 */
export const display = Marcellus({
  // 'latin' only. next/font PRELOADS every subset listed, and Google's latin
  // range already covers every French accent, including the U+0152-0153 oe
  // ligature. Adding 'latin-ext' downloads a second file per family for
  // glyphs this site never renders.
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display-face',
  display: 'swap',
});

export const body = Jost({
  subsets: ['latin'],
  // No `weight`: Jost is variable, so one file serves every weight we use.
  variable: '--font-body-face',
  display: 'swap',
});

export const fontClass = `${display.variable} ${body.variable}`;
