import type { Locale } from '@/i18n/config';
import ThankYou from '@/components/ThankYou';

export default function ThanksPageView({ locale }: { locale: Locale }) {
  return (
    <div className="container section--tight">
      <ThankYou locale={locale} />
    </div>
  );
}
