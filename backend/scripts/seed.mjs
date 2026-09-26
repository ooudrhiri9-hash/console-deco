/**
 * Fills an empty database from the files the shop shipped with.
 *
 * Source of truth for the first run only: frontend/src/data/{categories,products}.ts,
 * the generated files the CSV importer used to write. After this, the admin
 * screens own the catalogue and those files are only the offline fallback.
 *
 *   node scripts/seed.mjs            # only writes what is missing
 *   node scripts/seed.mjs --force    # replaces products and categories wholesale
 *
 * Safe to re-run: without --force it never touches an existing product, and it
 * never touches orders or messages at all.
 */
import bcrypt from 'bcryptjs';

import { env } from '../src/env.js';
import { connectStore, store } from '../src/store/index.js';
import { normaliseProduct } from '../src/lib/product.js';
import { normaliseCategory } from '../src/lib/category.js';
import { DEFAULT_SETTINGS, normaliseSettings } from '../src/lib/settings.js';
import { readArray } from './data-files.mjs';

const force = process.argv.includes('--force');

async function seedCategories() {
  const source = await readArray('categories.ts', 'categories');
  const existing = await store.categories.all();

  if (force && existing.length) {
    await store.categories.replaceAll([]);
  } else if (existing.length) {
    console.log(`· catégories : ${existing.length} déjà en base, inchangées`);
    return new Set(existing.map((c) => c.id));
  }

  const ids = new Set();
  for (const raw of source) {
    const { error, category } = normaliseCategory(raw, null);
    if (error) {
      console.warn(`  ! catégorie ignorée (${raw.id}) : ${error}`);
      continue;
    }
    await store.categories.create(category);
    ids.add(category.id);
  }
  console.log(`✓ catégories : ${ids.size} écrites`);
  return ids;
}

async function seedProducts(categoryIds) {
  const source = await readArray('products.ts', 'products');
  const existing = await store.products.all();

  if (force && existing.length) {
    await store.products.replaceAll([]);
  } else if (existing.length) {
    console.log(`· pièces : ${existing.length} déjà en base, inchangées`);
    return;
  }

  const now = new Date().toISOString();
  let written = 0;
  for (const raw of source) {
    const { error, product } = normaliseProduct(raw, null, categoryIds);
    if (error) {
      console.warn(`  ! pièce ignorée (${raw.id}) : ${error}`);
      continue;
    }
    await store.products.create({
      ...product,
      slug: raw.slug || product.id.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    });
    written += 1;
  }
  console.log(`✓ pièces : ${written} écrites`);
}

async function seedSettings() {
  const saved = await store.settings.read();
  if (saved && Object.keys(saved).length && !force) {
    console.log('· réglages : déjà en base, inchangés');
    return;
  }
  await store.settings.write(normaliseSettings(saved || {}, DEFAULT_SETTINGS));
  console.log('✓ réglages : valeurs par défaut écrites');
}

async function seedAdmin() {
  const email = env('ADMIN_EMAIL').toLowerCase();
  const password = env('ADMIN_PASSWORD');

  if (!email || !password) {
    console.warn('! ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte créé.');
    return;
  }
  if (password.length < 10) {
    console.warn('! ADMIN_PASSWORD fait moins de 10 caractères. La boutique est '
      + 'en ligne et son API publique : choisissez une valeur plus longue.');
  }

  const existing = await store.admins.get(email);
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    // Re-running the seed is the documented way to reset a forgotten password.
    await store.admins.update(email, { passwordHash });
    console.log(`✓ administrateur : mot de passe de ${email} réinitialisé`);
    return;
  }
  await store.admins.create({ email, name: 'Administrateur', passwordHash, createdAt: new Date().toISOString() });
  console.log(`✓ administrateur : ${email} créé`);
}

async function main() {
  await connectStore();
  console.log(force ? 'Seed (--force : catalogue remplacé)' : 'Seed (non destructif)');

  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedSettings();
  await seedAdmin();

  console.log('Terminé.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Échec du seed :', e);
  process.exit(1);
});
