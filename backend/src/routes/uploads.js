/**
 * Product photo upload.
 *
 * The file is re-encoded to WebP at the same 800×1000 the existing catalogue
 * uses, plus a 400×500 thumbnail, and written under backend/uploads/. The API
 * serves that folder, so the returned URL is absolute and works from the shop
 * on its own separate domain.
 *
 * ⚠ Deploying the API to a host with an ephemeral disk (Render, Vercel, Heroku)
 * loses every uploaded photo on the next deploy. There, either attach a
 * persistent volume, or keep uploading photos through the hosting file manager
 * into the shop's own /media/products/ and paste the path in the form — the
 * image field accepts both a path and a URL.
 */
import path from 'node:path';
import fsp from 'node:fs/promises';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { requireAdmin } from '../auth.js';
import { env, ROOT } from '../env.js';
import { slugify } from '../lib/text.js';
import { uploadToCloudinary, usingCloudinary } from '../lib/cloudinary.js';

export const uploadRoutes = Router();

export const UPLOAD_DIR = path.join(ROOT, 'uploads');

const WIDTH = 800;
const HEIGHT = 1000;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter(req, file, done) {
    if (!ACCEPTED.has(file.mimetype)) {
      done(new Error('Format non accepté. Utilisez JPEG, PNG, WebP ou AVIF.'));
      return;
    }
    done(null, true);
  },
});

uploadRoutes.post('/uploads', requireAdmin, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier reçu.' });
      return;
    }

    try {
      const stem = [
        slugify(req.body?.name || path.parse(req.file.originalname).name) || 'photo',
        Date.now().toString(36),
      ].join('-');

      // `cover` crops to the catalogue's portrait frame so cards never letterbox;
      // `withoutEnlargement` keeps a small original from being upscaled into mush.
      const base = sharp(req.file.buffer).rotate();
      const full = base.clone()
        .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention', withoutEnlargement: true })
        .webp({ quality: 82 });
      const thumb = base.clone()
        .resize(Math.round(WIDTH / 2), Math.round(HEIGHT / 2), { fit: 'cover', position: 'attention', withoutEnlargement: true })
        .webp({ quality: 74 });

      // Cloudinary when it is configured: the photo then survives a deploy on a
      // host with an ephemeral disk, and is served from a CDN.
      if (usingCloudinary()) {
        const [buffer, thumbBuffer] = await Promise.all([full.toBuffer(), thumb.toBuffer()]);
        const folder = env('CLOUDINARY_FOLDER', 'atelier-omar/produits');
        const [url, thumbnail] = await Promise.all([
          uploadToCloudinary(buffer, stem, folder),
          uploadToCloudinary(thumbBuffer, `${stem}-thumb`, folder),
        ]);
        res.status(201).json({ ok: true, url, thumbnail, storage: 'cloudinary' });
        return;
      }

      await fsp.mkdir(UPLOAD_DIR, { recursive: true });
      await full.toFile(path.join(UPLOAD_DIR, `${stem}.webp`));
      await thumb.toFile(path.join(UPLOAD_DIR, `${stem}-thumb.webp`));

      const publicUrl = env('PUBLIC_URL', `http://localhost:${env('PORT', '4400')}`).replace(/\/$/, '');
      res.status(201).json({
        ok: true,
        url: `${publicUrl}/uploads/${stem}.webp`,
        thumbnail: `${publicUrl}/uploads/${stem}-thumb.webp`,
        storage: 'local',
      });
    } catch (e) {
      console.error('[upload]', e);
      res.status(500).json({ error: "L'image n'a pas pu être traitée." });
    }
  });
});
