/** Small formatters shared by the back-office screens. */

/** 12500 -> "12 500 DH". 0 is a real state: "prix sur demande". */
export const dh = (n: number) =>
  n > 0 ? `${new Intl.NumberFormat('fr-FR').format(n)} DH` : 'Sur demande';

/** ISO timestamp -> "11/09/2026 19:42". */
export const dateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** ISO date -> "11/09". Used on the 14-day chart where space is tight. */
export const shortDay = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

/**
 * Même règle que slugify() dans backend/src/lib/text.js : c'est ainsi que l'API
 * fabrique l'id d'une valeur à son premier enregistrement. Le formulaire s'en
 * sert pour rattacher un supplément à un format qui n'a pas encore d'id.
 */
export function slugId(input: string, max = 40): string {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
}
