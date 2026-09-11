/**
 * Les pièces les plus commandées, calculées à partir des vraies commandes.
 *
 * Rien n'est saisi à la main ici : un classement « meilleures ventes » qui ne
 * vient pas des ventes est un mensonge commercial, et le premier client qui
 * demande « pourquoi celle-là ? » n'aura pas de réponse. Tant qu'il n'y a pas
 * assez de commandes, la fonction renvoie une liste vide et la boutique
 * n'affiche tout simplement pas la section.
 */

/** Une commande annulée n'est pas une vente. */
const COUNTS = new Set(['nouvelle', 'confirmee', 'expediee', 'livree']);

const WINDOW_DAYS = 180;

/** Nombre minimum de pièces classées pour que la section ait un sens. */
export const MIN_RANKED = 3;

/**
 * @param {Array} orders    commandes stockées
 * @param {Array} products  catalogue (pour ignorer les pièces disparues)
 * @param {number} limit    taille du classement
 * @returns {Array<{ slug: string, sold: number }>} du plus vendu au moins vendu
 */
export function bestSellers(orders = [], products = [], limit = 4) {
  const live = new Map(products.filter((p) => p.active !== false).map((p) => [p.slug, p]));
  const since = Date.now() - WINDOW_DAYS * 86_400_000;
  const sold = new Map();

  for (const order of orders) {
    if (!COUNTS.has(order?.status)) continue;
    // Une vente d'il y a un an ne dit plus rien de ce qui part aujourd'hui.
    const at = Date.parse(order.createdAt || '');
    if (Number.isFinite(at) && at < since) continue;

    for (const line of order.items || []) {
      // Le panier enregistre le slug ET la référence ; le slug est la clé des
      // pages, donc c'est lui qui fait foi ici.
      if (!line?.slug || !live.has(line.slug)) continue;
      sold.set(line.slug, (sold.get(line.slug) || 0) + (Number(line.qty) || 0));
    }
  }

  const ranked = [...sold.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([slug, qty]) => ({ slug, sold: qty }));

  // Deux pièces vendues une fois chacune ne font pas un palmarès : mieux vaut
  // ne rien afficher que d'afficher un classement qui ne classe rien.
  return ranked.length >= MIN_RANKED ? ranked : [];
}
