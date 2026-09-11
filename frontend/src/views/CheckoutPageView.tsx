import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CheckoutForm from '@/components/CheckoutForm';

export default function CheckoutPageView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <>
      <Breadcrumbs
        items={[
          { label: t.nav.home, href: routes.home(locale) },
          { label: t.cart.title, href: routes.cart(locale) },
          { label: t.checkout.title },
        ]}
      />
      <div className="container section--tight">
        <div className="section-head">
          <h1 className="h-1">{t.checkout.title}</h1>
          <p>{t.checkout.intro}</p>
        </div>
        <CheckoutForm locale={locale} />
      </div>
    </>
  );
}
