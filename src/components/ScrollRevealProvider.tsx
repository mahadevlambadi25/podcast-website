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
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.setAttribute('data-revealed', 'true');
            observer.unobserve(target);
          }
        }
      },
      {
        root: null,
        rootMargin: '40px 0px -20px 0px',
        threshold: 0.05,
      }
    );
    observerRef.current = observer;

    // 5. Function to scan and register unrevealed elements with zero layout thrashing
    const scanAndObserve = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        '[data-reveal]:not([data-revealed="true"])'
      );
      for (let i = 0; i < elements.length; i++) {
        observer.observe(elements[i]);
      }
    };

    // Scan initial elements
    scanAndObserve();

    // 6. Observe DOM mutations for dynamic content with targeted element filtering
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const mutationObserver = new MutationObserver((mutations) => {
      let hasNewRevealElements = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            const node = m.addedNodes[j];
            if (node.nodeType === 1) {
              const el = node as HTMLElement;
              if (el.hasAttribute?.('data-reveal') || el.querySelector?.('[data-reveal]')) {
                hasNewRevealElements = true;
                break;
              }
            }
          }
        }
        if (hasNewRevealElements) break;
      }

      if (!hasNewRevealElements) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanAndObserve();
      }, 100);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      mql.removeEventListener('change', handleMotionChange);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
