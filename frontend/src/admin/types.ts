/** Shapes the back office receives from /api/admin. */
import type { Category, Product } from '@/types';

/** A product as the admin sees it: the shop never receives `active`. */
export type AdminProduct = Product & {
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCategory = Category;

export type OrderStatus = 'nouvelle' | 'confirmee' | 'expediee' | 'livree' | 'annulee';

export type OrderLine = {
  id: string;
  slug: string;
  name: { fr: string; en: string };
  qty: number;
  price: number;
  lineTotal: number;
  /** Price the cart displayed, kept only when the catalogue disagreed. */
  quotedPrice?: number;
  /** Choices resolved by the API (cadre, format, sur mesure…). */
  options?: OrderLineOption[];
};

export type OrderLineOption = {
  id: string;
  name: { fr: string; en: string };
  valueId: string;
  label: { fr: string; en: string };
  extra: number;
  /** Value id the cart asked for, kept only when it no longer existed. */
  requested?: string;
};

export type Order = {
  reference: string;
  locale: 'fr' | 'en';
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    notes: string;
  };
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: string;
  quoteOnly: boolean;
  rejected: string[];
  status: OrderStatus;
  adminNote?: string;
  /** Outcome of the WhatsApp confirmation message (absent on older orders). */
  whatsapp?: {
    status: 'disabled' | 'sent' | 'delivered' | 'read' | 'failed';
    at: string;
    to?: string;
    messageId?: string;
    error?: string;
  };
  /** Set when the customer answered the confirmation themselves. */
  confirmation?: { by: 'whatsapp'; result: OrderStatus; at: string };
  /** 'whatsapp' = sale closed in a chat and typed in by hand; absent = website order. */
  channel?: 'whatsapp';
  /** « MD-XXXX » reference from the chat, when the customer clicked a site button. */
  leadRef?: string;
  /** Outcome of the server-side Purchase sent to Meta (Conversions API). */
  capi?: {
    purchase?: {
      status: 'disabled' | 'sent' | 'failed';
      at: string;
      eventId: string;
      error?: string;
      test?: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  locale: 'fr' | 'en';
  read: boolean;
  createdAt: string;
};

export type Stats = {
  products: number;
  productsLive: number;
  productsWithoutPrice: number;
  productsWithoutImage: number;
  categories: number;
  orders: number;
  ordersOpen: number;
  revenue: number;
  averageBasket: number;
  messagesUnread: number;
};

export type Dashboard = {
  stats: Stats;
  chart: Array<{ day: string; orders: number; revenue: number }>;
  recentOrders: Order[];
};

export type Settings = {
  brand: string;
  brandShort: string;
  baseline: { fr: string; en: string };
  url: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  email: string;
  address: { street: string; city: string; region: string; postalCode: string; country: string };
  hours: { fr: string; en: string };
  social: { instagram: string; facebook: string; tiktok: string };
  currency: string;
  currencyLabel: string;
  freeShippingThreshold: number;
  shippingFlatRate: number;
  announcement: { fr: string; en: string };
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};
