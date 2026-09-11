/**
 * Admin authentication.
 *
 * The token travels in `Authorization: Bearer …`, not in a cookie. The shop is
 * a static export served from another domain, so it cannot receive a cookie set
 * by this API. The trade-off to accept: the token is readable by page
 * JavaScript, so it is short-lived and AUTH_SECRET must be long.
 */
import jwt from 'jsonwebtoken';
import { env } from './env.js';

const LIFETIME = '12h';

function secret() {
  const s = env('AUTH_SECRET');
  if (s.length < 16) {
    throw new Error('AUTH_SECRET is missing or shorter than 16 characters.');
  }
  return s;
}

export const signToken = (payload) => jwt.sign(payload, secret(), { expiresIn: LIFETIME });

export function readToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

/** Rejects the request unless the Authorization header carries a valid token. */
export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const session = token ? readToken(token) : null;

  if (!session) {
    res.status(401).json({ error: 'unauthorised' });
    return;
  }
  req.session = session;
  next();
}

/**
 * Crude per-IP throttle for the login route. Enough to make password guessing
 * pointless without adding a dependency or a second datastore.
 */
export function throttle({ tries = 5, windowMs = 60_000 } = {}) {
  const seen = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const hits = (seen.get(key) || []).filter((t) => now - t < windowMs);
    if (hits.length >= tries) {
      res.status(429).json({ error: 'too_many_attempts' });
      return;
    }
    hits.push(now);
    seen.set(key, hits);
    // Keep the map from growing without bound on a long-running process.
    if (seen.size > 5000) {
      for (const [k, v] of seen) if (!v.some((t) => now - t < windowMs)) seen.delete(k);
    }
    next();
  };
}
