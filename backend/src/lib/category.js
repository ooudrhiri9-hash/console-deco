/**
 * Shape and bounds for a product family. The slug is bilingual because the URLs
 * are translated (/produits/consoles/ vs /en/products/consoles/), so changing
 * one here changes a real, indexed URL — see the warning in the admin screen.
 */
import { clean, int, localized, slugify } from './text.js';

export function normaliseCategory(body = {}, base = null) {
  const merged = { ...(base || {}), ...body };

  const name = localized(merged.name, { max: 100 });
  if (!name.fr) return { error: 'Le nom en français est obligatoire.' };

  const id = clean(merged.id, 60) || slugify(name.fr);
  if (!id) return { error: 'Identifiant de catégorie invalide.' };

  const rawSlug = merged.slug && typeof merged.slug === 'object' ? merged.slug : {};
  const fr = slugify(rawSlug.fr || name.fr);
  const en = slugify(rawSlug.en || name.en || fr);
  if (!fr || !en) return { error: 'Les deux adresses (FR et EN) sont obligatoires.' };

  return {
    category: {
      id,
      slug: { fr, en },
      name,
      tagline: localized(merged.tagline, { max: 160 }),
      description: localized(merged.description, { max: 4000 }),
      image: clean(merged.image, 500),
      order: int(merged.order, { min: 1, max: 999, fallback: 99 }),
    },
  };
}
