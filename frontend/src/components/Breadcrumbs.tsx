import Link from '@/components/Link';
import { site } from '@/config/site';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Visible breadcrumb + the matching BreadcrumbList JSON-LD, so Google can show
 * the trail in the result snippet instead of a bare URL.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${site.url}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <nav className="crumbs container" aria-label="Breadcrumb">
        {items.map((c, i) => (
          <span key={`${c.label}-${i}`}>
            {i > 0 && (
              <span aria-hidden="true" style={{ marginRight: '.5rem' }}>
                /
              </span>
            )}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
