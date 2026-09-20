'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { Category, OptionChoice, Product } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { deliveryAlwaysFree, site } from '@/config/site';
import { dimensionsLabel, discountPercent, formatPrice, paragraphs } from '@/lib/format';
import {
  compareAtFor,
  CUSTOM_SIZE,
  defaultChoice,
  frameOption,
  optionsOf,
  packCustomSize,
  parseCustomSize,
  pickedValue,
  sizeOption,
  unitPrice,
} from '@/lib/options';
import { routes } from '@/lib/routes';
import { productMessage, waLink } from '@/lib/whatsapp';
import { useCart } from './CartProvider';
import { useFavorites } from './FavoritesProvider';
import { ArrowIcon, CashIcon, HandIcon, HeartIcon, MinusIcon, PlusIcon, RulerIcon, TruckIcon, WhatsappIcon } from './Icons';
import { useLiveProduct } from './LiveCatalogue';
import Link from './Link';
import OptionPicker, { FramePicker, SizePicker } from './OptionPicker';
import ProductGallery from './ProductGallery';
import { CustomSizeFields, CustomSizeTile, emptyDims, type Dims } from './CustomSize';

const TRUST_ICONS = [CashIcon, HandIcon, RulerIcon, TruckIcon];
const MAX_QTY = 99;

/**
 * Le corps de la fiche : photos, choix, prix, panier, et tout ce qu'on lit
 * avant d'acheter.
 *
 * Tout ce qui touche au prix suit le catalogue en direct : le HTML statique
 * porte le prix du dernier build (celui que lisent Google et un visiteur sans
 * JavaScript), le navigateur le corrige un instant plus tard. Une pièce retirée
 * dans /admin le dit et cesse de prendre des commandes.
 */
export default function ProductDetail({
  product: built,
  locale,
  category,
}: {
  product: Product;
  locale: Locale;
  category?: Category;
}) {
  const t = getDict(locale);
  const { product, removed } = useLiveProduct(built);
  const { add } = useCart();
  const favorites = useFavorites();

  // La sélection part de la fiche construite : le HTML statique affiche donc le
  // même prix que le premier rendu du navigateur. Si le catalogue en direct
  // change les choix ensuite, les valeurs disparues retombent sur la première.
  const [picked, setPicked] = useState<OptionChoice>(() => defaultChoice(built));

  // Dimensions sur mesure : une saisie libre, pas un choix de la fiche. Tant
  // qu'elle est incomplète, la sélection reste celle des formats proposés.
  const [custom, setCustom] = useState(false);
  const [dims, setDims] = useState<Dims>(emptyDims);
  const wanted = custom
    ? parseCustomSize([dims.width, dims.depth, dims.height].filter(Boolean).join('x'))
    : null;

  const choice = useMemo(() => {
    const out: OptionChoice = { ...defaultChoice(product) };
    for (const [k, v] of Object.entries(picked)) {
      const option = optionsOf(product).find((o) => o.id === k);
      if (option?.values.some((x) => x.id === v)) out[k] = v;
    }
    if (wanted) out[CUSTOM_SIZE] = packCustomSize(wanted);
    return out;
  }, [product, picked, wanted?.width, wanted?.depth, wanted?.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (optionId: string, valueId: string) => {
    setCustom(false);
    setPicked((c) => ({ ...c, [optionId]: valueId }));
  };

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const size = sizeOption(product);
  const frame = frameOption(product);
  const others = optionsOf(product).filter((o) => o !== size && o !== frame);
  const sizeId = size ? pickedValue(size, choice).id : undefined;
  const frameValue = frame ? pickedValue(frame, choice) : undefined;

  const price = unitPrice(product, choice);
  const was = compareAtFor(product, choice);
  const off = discountPercent(product);
  const dimsLabel = dimensionsLabel(product);
  const liked = favorites.ready && favorites.has(product.slug);

  // « Prix pour 100 × 100 cm, caisse américaine. » — ce que couvre le montant.
  const priceFor = [size, frame]
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => pickedValue(o, choice).label[locale])
    .join(', ');

  const onAdd = () => {
    add(product, qty, choice);
    setAdded(true);
  };

  const wa = waLink(
    productMessage(product, locale, qty, `${site.url}${routes.product(locale, product)}`, choice),
  );

  return (
    <div className="product">
      <div className="product__media">
        <ProductGallery product={product} locale={locale} frame={frameValue?.swatch} />
        {frame && !removed && (
          <FramePicker
            product={product}
            option={frame}
            locale={locale}
            choice={choice}
            onChange={pick}
            sizeId={sizeId}
          />
        )}
      </div>

      <div className="product__info">
        <span className="eyebrow">
          {category ? `${category.name[locale]} · ` : ''}
          {t.common.reference} {product.id}
        </span>
        <h1 className="h-1 product__title">{product.name[locale]}</h1>
        <p className="muted">{product.shortDescription[locale]}</p>

        {removed ? (
          <div className="stack" style={{ marginTop: '1.5rem' }}>
            <p className="alert alert--err">{t.common.unavailable}</p>
            <p className="muted">{t.common.unavailableHint}</p>
            <div className="buy-row">
              <Link href={routes.contact(locale)} className="btn btn--primary">
                {t.nav.contact}
              </Link>
              <a href={`tel:${site.phoneHref}`} className="btn btn--outline">
                {site.phone}
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="product__price">
              {custom ? (
                <strong>{t.products.quote}</strong>
              ) : product.price > 0 ? (
                <>
                  <strong>{formatPrice(price, locale)}</strong>
                  {was && <del>{formatPrice(was, locale)}</del>}
                  {off !== null && <span className="badge badge--sale badge--inline">-{off}%</span>}
                </>
              ) : (
                <strong>{t.common.onRequest}</strong>
              )}
            </div>
            {!custom && product.price > 0 && (priceFor || deliveryAlwaysFree || site.freeShippingThreshold > 0) && (
              <p className="product__price-note">
                {priceFor && t.products.priceFor(priceFor)}
                {priceFor && (deliveryAlwaysFree || site.freeShippingThreshold > 0) && ' '}
                {deliveryAlwaysFree
                  ? t.products.freeDeliveryAll
                  : site.freeShippingThreshold > 0 &&
                    t.products.freeDelivery(formatPrice(site.freeShippingThreshold, locale))}
              </p>
            )}

            <span className={`stock${product.madeToOrder ? ' stock--order' : ''}`}>
              {product.madeToOrder
                ? `${t.common.madeToOrder}${
                    product.leadTimeDays ? ` · ${t.common.leadTime} ${product.leadTimeDays} ${t.common.days}` : ''
                  }`
                : t.common.inStock}
            </span>

            <div className="options">
              {size ? (
                <SizePicker
                  product={product}
                  option={size}
                  locale={locale}
                  choice={choice}
                  onChange={pick}
                  customActive={custom}
                  custom={
                    <CustomSizeTile
                      group={`option-${size.id}`}
                      locale={locale}
                      active={custom}
                      onSelect={() => setCustom(true)}
                    />
                  }
                />
              ) : (
                /* Sans formats proposés, le choix se réduit à deux : les
                   dimensions de la pièce, ou les vôtres. */
                <fieldset className="option">
                  <legend className="option__name">
                    {t.products.sizeTitle}
                    <span className="option__current">
                      {' · '}
                      {custom ? t.products.customSize : dimsLabel || t.products.sizeStandard}
                    </span>
                  </legend>
                  <div className="size-grid">
                    <label className={`size-opt${custom ? '' : ' is-active'}`} htmlFor="size-standard">
                      <input
                        id="size-standard"
                        type="radio"
                        name="size-mode"
                        checked={!custom}
                        onChange={() => setCustom(false)}
                      />
                      <b>{t.products.sizeStandard}</b>
                      {dimsLabel && <span>{dimsLabel}</span>}
                    </label>
                    <CustomSizeTile
                      group="size-mode"
                      locale={locale}
                      active={custom}
                      onSelect={() => setCustom(true)}
                    />
                  </div>
                </fieldset>
              )}

              {custom && (
                <CustomSizeFields
                  locale={locale}
                  dims={dims}
                  onChange={setDims}
                  /* Un tableau n'a pas de profondeur à donner ; un meuble si. */
                  showDepth={!size}
                  invalid={!wanted && [dims.width, dims.depth, dims.height].some(Boolean)}
                />
              )}

              {others.map((option) => (
                <OptionPicker
                  key={option.id}
                  product={product}
                  option={option}
                  locale={locale}
                  choice={choice}
                  onChange={pick}
                  sizeId={sizeId}
                />
              ))}
            </div>

            <div className="option">
              <span className="option__name">{t.products.quantity}</span>
              <div className="qty-row">
                <div className="qty" role="group" aria-label={t.products.quantity}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label={t.products.less}
                  >
                    <MinusIcon />
                  </button>
                  <span aria-live="polite">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                    disabled={qty >= MAX_QTY}
                    aria-label={t.products.more}
                  >
                    <PlusIcon />
                  </button>
                </div>
                {qty > 1 && price > 0 && (
                  <em className="qty-row__total">{t.products.qtyTotal(formatPrice(price * qty, locale))}</em>
                )}
              </div>
            </div>

            <div className="buy">
              <div className="buy__main">
                {/* Des dimensions entamées mais incomplètes ne partent pas au
                    panier : la ligne serait une pièce standard, pas la vôtre. */}
                <button
                  type="button"
                  className="btn btn--primary buy__add"
                  onClick={onAdd}
                  disabled={custom && !wanted}
                >
                  {added ? t.products.added : t.products.addToCart}
                </button>
                <button
                  type="button"
                  className={`buy__fav${liked ? ' is-active' : ''}`}
                  onClick={() => favorites.toggle(product.slug)}
                  aria-pressed={liked}
                  aria-label={liked ? t.products.removeFavorite : t.products.addFavorite}
                  title={liked ? t.products.removeFavorite : t.products.addFavorite}
                >
                  <HeartIcon filled={liked} />
                </button>
              </div>
              {added && (
                <Link href={routes.cart(locale)} className="buy__cart">
                  {t.products.viewCart} <ArrowIcon />
                </Link>
              )}
              <a className="btn btn--whatsapp btn--block" href={wa} target="_blank" rel="noopener noreferrer">
                <WhatsappIcon size={18} />
                {t.products.orderWhatsapp}
              </a>
            </div>
          </>
        )}

        <ul className="trust">
          {t.products.trust.map((item, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <li key={item.title}>
                <Icon />
                <div>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="faq product__faq">
          <details className="faq__item" open>
            <summary className="faq__q">
              {t.products.tabDescription}
              <span className="faq__sign" aria-hidden="true" />
            </summary>
            <div className="faq__a">
              {paragraphs(product.description[locale] || product.shortDescription[locale]).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </details>

          <details className="faq__item">
            <summary className="faq__q">
              {t.products.tabDetails}
              <span className="faq__sign" aria-hidden="true" />
            </summary>
            <div className="faq__a">
              <dl className="spec-list">
                <dt>{t.common.reference}</dt>
                <dd>{product.id}</dd>
                {dimsLabel && (
                  <>
                    <dt>{t.common.dimensions}</dt>
                    <dd>{dimsLabel}</dd>
                  </>
                )}
                {product.materials[locale] && (
                  <>
                    <dt>{t.common.materials}</dt>
                    <dd>{product.materials[locale]}</dd>
                  </>
                )}
                {product.finish?.[locale] && (
                  <>
                    <dt>{t.common.finish}</dt>
                    <dd>{product.finish[locale]}</dd>
                  </>
                )}
                {product.colors.length > 0 && (
                  <>
                    <dt>{t.common.colors}</dt>
                    <dd>{product.colors.map((c) => c[locale]).join(', ')}</dd>
                  </>
                )}
              </dl>
            </div>
          </details>

          {size && (
            <details className="faq__item">
              <summary className="faq__q">
                {t.products.tabSize}
                <span className="faq__sign" aria-hidden="true" />
              </summary>
              <div className="faq__a">
                <p>{t.products.sizeGuide}</p>
              </div>
            </details>
          )}

          {product.madeToOrder && (
            <details className="faq__item">
              <summary className="faq__q">
                {t.products.tabCustom}
                <span className="faq__sign" aria-hidden="true" />
              </summary>
              <div className="faq__a">
                <p>{t.products.customNote}</p>
              </div>
            </details>
          )}

          <details className="faq__item">
            <summary className="faq__q">
              {t.products.tabDelivery}
              <span className="faq__sign" aria-hidden="true" />
            </summary>
            <div className="faq__a">
              <p>{t.products.delivery}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
