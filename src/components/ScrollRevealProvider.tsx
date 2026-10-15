'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRevealProvider() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 1. Accessibility check: if user prefers reduced motion, ensure all content is visible immediately
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        el.setAttribute('data-revealed', 'true');
      });
      return;
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.querySelectorAll('[data-reveal]').forEach((el) => {
          el.setAttribute('data-revealed', 'true');
        });
      }
    };
    mql.addEventListener('change', handleMotionChange);

    // 2. Feature detection: If IntersectionObserver is unavailable, exit gracefully without hiding content
    if (!('IntersectionObserver' in window)) {
      return;
    }

    // 3. Mark HTML as ready for reveal animations (Progressive enhancement guard)
    document.documentElement.classList.add('js-reveal-active');

    // 4. Create single centralized IntersectionObserver instance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.setAttribute('data-revealed', 'true');
            observer.unobserve(target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px', // Trigger slightly before element enters deep into viewport
        threshold: 0.08,
      }
    );
    observerRef.current = observer;

    // 5. Function to scan and register unrevealed elements
    const scanAndObserve = () => {
      const windowHeight = window.innerHeight;
      const elements = document.querySelectorAll<HTMLElement>(
        '[data-reveal]:not([data-revealed="true"])'
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If element is already in the viewport or already scrolled past, reveal immediately without flicker
        if (rect.top < windowHeight * 0.95) {
          el.setAttribute('data-revealed', 'true');
        } else {
          observer.observe(el);
        }
      });
    };

    // Immediate synchronous scan to reveal above-the-fold elements before first paint
    scanAndObserve();

    // Secondary scan after next repaint for any late-rendered or layout-shifted elements
    const animFrame = requestAnimationFrame(() => {
      scanAndObserve();
    });

    // 6. Observe DOM mutations for dynamic content (search results, filters, async data)
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const mutationObserver = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanAndObserve();
      }, 80);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrame);
      if (debounceTimer) clearTimeout(debounceTimer);
      mql.removeEventListener('change', handleMotionChange);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
