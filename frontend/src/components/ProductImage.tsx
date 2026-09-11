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
}: {
  src?: string;
  alt: string;
  seed: string;
  priority?: boolean;
}) {
  if (!src) return <ImagePlaceholder seed={seed} label={alt} />;
  // Plain <img>: static export has no image optimiser, and these are already
  // served as pre-sized WebP from /public.
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width={800}
      height={1000}
    />
  );
}
