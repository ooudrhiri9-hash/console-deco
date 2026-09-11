import NextLink from 'next/link';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof NextLink>;

/**
 * next/link with prefetch OFF by default.
 *
 * In a static export there is no RSC payload to prefetch, so every prefetch
 * fires a request for `/…/__next.<hash>.txt?_rsc=…` that 404s. Those 404s
 * flood the console and count against Lighthouse "errors-in-console".
 * A static site navigates instantly anyway.
 */
export default function Link({ prefetch = false, ...rest }: Props) {
  return <NextLink prefetch={prefetch} {...rest} />;
}
