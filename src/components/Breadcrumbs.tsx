import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { siteConfig } from '@/config/site';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const baseUrl = siteConfig.siteUrl.replace(/\/$/, '');

  const breadcrumbListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/`,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        item: item.href ? `${baseUrl}${item.href}` : undefined,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex items-center flex-wrap gap-2 text-xs text-neu-muted">
          <li className="flex items-center">
            <Link
              href="/"
              className="neu-pill px-3 py-1.5 text-neu-muted hover:text-neu-charcoal hover:neu-raised-sm transition-all flex items-center gap-1 font-semibold"
              aria-label="Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </li>

          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={idx} className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-neu-muted/60 shrink-0" />
                {item.href && !isLast ? (
                  <Link href={item.href} className="neu-pill px-3 py-1.5 text-neu-muted hover:text-neu-charcoal hover:neu-raised-sm transition-all font-semibold">
                    {item.label}
                  </Link>
                ) : (
                  <span className="neu-inset px-3 py-1.5 rounded-full text-gold-600 font-bold truncate max-w-[240px] sm:max-w-md" aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
