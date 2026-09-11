export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

/** French is served at the root; English lives under /en. */
export const localePrefix: Record<Locale, string> = { fr: '', en: '/en' };

export const localeLabel: Record<Locale, string> = { fr: 'FR', en: 'EN' };
export const htmlLang: Record<Locale, string> = { fr: 'fr-MA', en: 'en' };
