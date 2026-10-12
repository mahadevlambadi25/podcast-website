'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('unchartered_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }

    const handleOpen = () => setShowBanner(true);
    window.addEventListener('open_cookie_preferences', handleOpen);
    return () => window.removeEventListener('open_cookie_preferences', handleOpen);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('unchartered_cookie_consent', 'granted');
    setShowBanner(false);
    window.dispatchEvent(new Event('cookie_consent_updated'));
  };

  const handleDecline = () => {
    localStorage.setItem('unchartered_cookie_consent', 'denied');
    setShowBanner(false);
    window.dispatchEvent(new Event('cookie_consent_updated'));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-50 neu-card bg-neu-card/98 border border-white/90 p-5 rounded-2xl shadow-neu-raised-lg animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl neu-raised-sm text-gold-600 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-2 flex-1">
          <h4 className="text-sm font-bold text-neu-charcoal">Privacy &amp; Analytics Choices</h4>
          <p className="text-xs text-neu-body leading-relaxed">
            We use privacy-conscious analytics to understand audience reach and optimize episode playback. We respect your choices and never sell your data. Read our{' '}
            <Link href="/privacy-policy" className="text-gold-600 font-semibold hover:underline">
              Privacy Policy
            </Link>.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleAccept}
              className="neu-btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
            >
              Accept Analytics
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="neu-btn px-4 py-2 text-neu-muted hover:text-neu-charcoal text-xs font-semibold"
            >
              Essential Only
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDecline}
          aria-label="Close banner"
          className="text-neu-muted hover:text-neu-charcoal p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
