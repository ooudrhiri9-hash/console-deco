import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import FavoritesList from '@/components/FavoritesList';

export default function FavoritesPageView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <>
      <Breadcrumbs
        items={[{ label: t.nav.home, href: routes.home(locale) }, { label: t.favorites.title }]}
      />
      <div className="container section--tight">
        <div className="section-head">
          <h1 className="h-1">{t.favorites.title}</h1>
          <p>{t.favorites.intro}</p>
        </div>
        <FavoritesList locale={locale} />
      </div>
    </>
  );
}
