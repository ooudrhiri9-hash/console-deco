/**
 * Where the back office lives.
 *
 * The shop is a static export: this value is inlined at build time, so a change
 * here (or in .env.local) only takes effect on the next `npm run build`.
 * Local default matches `npm run dev` in ../backend.
 */
const RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400';

export const API_URL = RAW.trim().replace(/\/+$/, '');

/** Absolute URL for an API path: apiUrl('/api/orders'). */
export const apiUrl = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
