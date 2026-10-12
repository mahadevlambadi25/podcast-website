'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UNCHARTERED GLOBAL ROOT ERROR]:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#080D16', color: '#F8FAFC', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#121C2F', border: '1px solid #1F2E47', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <h1 style={{ color: '#C9A961', fontSize: '24px', margin: '0 0 16px 0' }}>Critical Application Error</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              The application encountered a critical fatal error. Please attempt to reload the experience.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: '#C9A961',
                color: '#080D16',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
