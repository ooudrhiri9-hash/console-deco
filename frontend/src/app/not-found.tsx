import type { Metadata } from 'next';
import { site } from '@/config/site';

/**
 * Exported as out/404.html, served by Apache via `ErrorDocument 404`.
 *
 * It sits OUTSIDE both language root layouts — with per-language root layouts
 * there is no root layout for it to inherit — so:
 *
 *  - it must NOT render its own <html>/<body>: Next already wraps the global
 *    not-found in a minimal shell, and doing both produces nested <html>;
 *  - it must carry its own styles inline, because an `import './globals.css'`
 *    here emits no <link rel="stylesheet"> in the export and the page would
 *    ship completely unstyled. Inline CSS is the right call anyway: zero extra
 *    requests on the one page most likely to be hit when assets are broken.
 *
 * `scripts/postbuild.mjs` adds the missing lang attribute to Next's shell.
 * Bilingual, because a single 404.html answers both /… and /en/… URLs.
 */
export const metadata: Metadata = {
  title: `Page introuvable · Page not found — ${site.brand}`,
  robots: { index: false, follow: true },
};

const css = `
  body{background:#ffffff;color:#14120f;margin:0;
       font:16px/1.65 Jost,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center}
  .nf{max-width:34rem}
  .nf .code{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#7a5a22;font-weight:500}
  .nf h1{font-family:Marcellus,Georgia,"Times New Roman",serif;font-weight:400;line-height:1.12;
     font-size:clamp(2rem,6vw,3rem);margin:.75rem 0 1rem}
  .nf p{color:#57534c;margin:0 0 .4rem}
  .nf hr{height:1px;background:#e6e3dd;border:0;margin:1.75rem 0}
  .nf .actions{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin-top:1.75rem}
  .nf a{display:inline-flex;align-items:center;justify-content:center;padding:.9rem 1.6rem;
    font-size:.82rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;border-radius:2px;
    text-decoration:none;border:1px solid #14120f;color:#14120f}
  .nf a.primary{background:#14120f;color:#ffffff}
`;

export default function NotFound() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="nf">
        <span className="code">Erreur 404</span>
        <h1>Page introuvable</h1>
        <p>Cette page n’existe pas ou a été déplacée.</p>
        <hr />
        <p lang="en">This page does not exist or has moved.</p>
        <div className="actions">
          <a className="primary" href="/">
            Accueil
          </a>
          <a href="/en/" hrefLang="en">
            Home
          </a>
        </div>
      </div>
    </>
  );
}
