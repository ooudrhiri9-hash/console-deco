/**
 * La commande qui vient de partir, passée de /commande/ à /merci/.
 *
 * Le panier est vidé dès l'envoi : sans ce relais, la page de remerciement
 * n'aurait plus rien à récapituler. sessionStorage plutôt que localStorage :
 * le récapitulatif ne doit pas réapparaître des jours plus tard, ni dans un
 * autre onglet. Silencieux si le navigateur refuse le stockage (navigation
 * privée) : la page affiche alors un remerciement sans récapitulatif.
 */
const KEY = 'md-last-order';

export interface LastOrder {
  reference: string;
  customer: { name: string; city: string; address: string };
  lines: { name: string; qty: number; price: number; picked: { name: string; label: string }[] }[];
  subtotal: number;
}

export function saveLastOrder(order: LastOrder) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {}
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}
