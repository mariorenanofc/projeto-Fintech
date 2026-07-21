import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/chat/',
          '/transactions/',
          '/*.json$',
        ],
      },
    ],
    sitemap: 'https://fintechcasal.com.br/sitemap.xml',
  };
}
