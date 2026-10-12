'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface AnalyticsProps {
  measurementId?: string | null;
}

export function Analytics({ measurementId }: AnalyticsProps) {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem('unchartered_cookie_consent');
      setConsentGranted(consent === 'granted');
    };

    checkConsent();
    window.addEventListener('cookie_consent_updated', checkConsent);
    return () => window.removeEventListener('cookie_consent_updated', checkConsent);
  }, []);

  const id = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!id || !consentGranted) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_path: window.location.pathname,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
