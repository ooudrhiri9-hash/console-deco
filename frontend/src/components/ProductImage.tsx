import { site } from '@/config/site';

/**
 * Renders the product photo, or — while the real catalogue photos are missing —
 * a branded SVG placeholder instead of a broken <img>.
 * The tint is derived from the seed so each piece looks distinct, and it is a
 * pure function so server HTML and client hydration always match.
 */
// Muted stone greys: on a white page a saturated beige well would read as a
// broken image rather than as a waiting frame.
const TINTS: Array<[string, string]> = [
  ['#f2f0eb', '#ddd8ce'],
  ['#efede8', '#d8d2c8'],
  ['#f1efe9', '#dbd5cb'],
  ['#edebe6', '#d5cfc5'],
  ['#f3f1ec', '#e0dad0'],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ImagePlaceholder({ seed, label }: { seed: string; label?: string }) {
  const [from, to] = TINTS[hash(seed) % TINTS.length];
  const id = `g-${hash(seed)}`;
  return (
    <svg viewBox="0 0 400 500" role="img" aria-label={label ?? site.brandShort} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${id})`} />
      <rect x="24" y="24" width="352" height="452" fill="none" stroke="rgba(255,255,255,.8)" />
      <text
        x="200"
        y="256"
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)' }}
        fontSize="20"
        letterSpacing="6"
        fill="rgba(20,18,15,.38)"
      >
        {site.brand}
      </text>
    </svg>
  );
}

export default function ProductImage({
  src,
  alt,
  seed,
  priority = false,
  width = 800,
  height = 1000,
  sizes = '(min-width: 1080px) 400px, (min-width: 640px) 33vw, 50vw',
}: {
  src?: string;
  alt: string;
  seed: string;
  priority?: boolean;
  /** Les photos de familles sont en 800x587, pas dans le puits 4:5 du catalogue. */
  width?: number;
  height?: number;
  sizes?: string;
}) {
  if (!src) return <ImagePlaceholder seed={seed} label={alt} />;

  // Plain <img>: static export has no image optimiser, and these are already
  // served as pre-sized WebP from /public.
  //
  // `prepare-media.mjs` ecrit une variante moitie a cote de chaque fichier de
  // /media/. Une carte fait 200 a 400 px de large : sans ce srcSet, le
  // navigateur telechargeait le 800 px de la fiche produit pour l'afficher au
  // quart de sa taille. Les photos envoyees depuis /admin n'ont pas cette
  // variante — leur URL ne commence pas par /media/, et elles gardent une
  // source unique.
  const half = src.startsWith('/media/') && src.endsWith('.webp')
    ? src.replace(/\.webp$/, '-400.webp')
    : null;

  return (
    <img
      src={src}
      {...(half ? { srcSet: `${half} 400w, ${src} 800w`, sizes } : {})}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width={width}
      height={height}
    />
  );
}
