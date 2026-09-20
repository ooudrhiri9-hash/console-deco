import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

/** Required by `output: export` — the file is written once at build time. */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // Transactional pages carry no SEO value and must not be indexed.
  const disallow = [
    '/panier/', '/commande/', '/en/cart/', '/en/checkout/', '/admin/',
    '/favoris/', '/en/favorites/',
    // Client-rendered fallback sheets: same piece as a real product page once
    // the site is rebuilt, so they must never compete with it in the index.
    '/produits/piece/', '/en/products/item/',
  ];

  /**
   * Answer engines, named explicitly. `User-agent: *` already allows them, but
   * being explicit states the intent and survives a future default-deny.
   * Remove this block if the client would rather not be used by AI assistants.
   */
  const aiCrawlers = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',       // OpenAI
    'ClaudeBot', 'Claude-Web', 'anthropic-ai',        // Anthropic
    'Google-Extended',                                // Gemini
    'PerplexityBot', 'Perplexity-User',               // Perplexity
    'Applebot-Extended',
    'CCBot',                                          // Common Crawl
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
