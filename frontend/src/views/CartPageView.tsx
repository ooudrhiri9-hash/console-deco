import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CartView from '@/components/CartView';

export default function CartPageView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <>
      <Breadcrumbs
        items={[{ label: t.nav.home, href: routes.home(locale) }, { label: t.cart.title }]}
      />
      <div className="container section--tight">
        <div className="section-head">
          <h1 className="h-1">{t.cart.title}</h1>
        </div>
        <CartView locale={locale} />
      </div>
    </>
  );
}
