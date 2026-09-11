/**
 * Cloudinary upload, without the SDK.
 *
 * Why it exists: photos added from /admin were written to backend/uploads/, and
 * a host with an ephemeral disk (Render, Vercel, Heroku) wipes that folder on
 * every deploy — the catalogue would lose its photos. Cloudinary keeps them
 * outside the server and serves them from its own CDN.
 *
 * Set CLOUDINARY_URL to switch it on; leave it empty and uploads keep going to
 * the local folder, which is what development wants.
 *
 * The signed upload is a plain multipart POST: the parameters are sorted,
 * joined, hashed with the API secret, and the hash travels as `signature`. That
 * is the whole protocol, so a dependency would buy nothing here.
 */
import crypto from 'node:crypto';
import { env } from '../env.js';

/** Parses cloudinary://<api_key>:<api_secret>@<cloud_name>. Null when unset. */
export function cloudinaryConfig() {
  const raw = env('CLOUDINARY_URL');
  if (!raw) return null;

  const m = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) {
    console.warn('[cloudinary] CLOUDINARY_URL mal formé, ignoré.');
    return null;
  }
  const [, apiKey, apiSecret, cloudName] = m;
  // A masked secret pasted from the dashboard ("**********") would fail on
  // every upload with a signature error; say so once, at boot, instead.
  if (/^\*+$/.test(apiSecret)) {
    console.warn('[cloudinary] le secret de CLOUDINARY_URL est masqué : uploads locaux.');
    return null;
  }
  return { cloudName, apiKey, apiSecret: decodeURIComponent(apiSecret) };
}

export const usingCloudinary = () => cloudinaryConfig() !== null;

const sign = (params, secret) => crypto
  .createHash('sha1')
  .update(
    Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&') + secret,
  )
  .digest('hex');

/**
 * Sends one image and returns its delivery URL.
 *
 * @param {Buffer} buffer   already resized and encoded (see routes/uploads.js)
 * @param {string} publicId file name inside the folder, no extension
 * @param {string} folder   Cloudinary folder, e.g. "atelier-omar/produits"
 */
export async function uploadToCloudinary(buffer, publicId, folder = 'atelier-omar') {
  const config = cloudinaryConfig();
  if (!config) throw new Error('Cloudinary non configuré.');

  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { folder, public_id: publicId, timestamp };

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/webp' }), `${publicId}.webp`);
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('signature', sign(signed, config.apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || `Cloudinary a répondu ${res.status}`);
  }
  return data.secure_url;
}
