'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { waLink } from '@/lib/whatsapp';
import { onWhatsappClick, type LeadChannel } from '@/lib/leads';

/** A WhatsApp button usable from server components, tagged like the others. */
export default function WhatsappLink({
  channel,
  message,
  locale,
  className,
  style,
  children,
}: {
  channel: LeadChannel;
  message: string;
  locale: Locale;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      className={className}
      style={style}
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onWhatsappClick(channel, message, locale)}
    >
      {children}
    </a>
  );
}
