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
