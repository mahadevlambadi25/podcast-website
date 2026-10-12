'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, MessageSquare } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured console error logging
    console.error('[UNCHARTERED ERROR BOUNDARY]:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full neu-card rounded-3xl p-8 text-center space-y-6 border border-neu-border">
        <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-editorial font-bold text-neu-charcoal tracking-tight">
            Unexpected Disruption
          </h2>
          <p className="text-sm text-neu-body leading-relaxed">
            We encountered an unexpected error while loading this content. Our engineering team has been automatically alerted.
          </p>
          {error.digest && (
            <p className="text-xs text-neu-muted font-mono pt-1">
              Ref ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl neu-btn-gold text-xs font-semibold uppercase tracking-wider min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl neu-btn text-neu-charcoal text-xs font-semibold uppercase tracking-wider min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>

        <div className="pt-4 border-t border-neu-border">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs text-neu-gold hover:text-neu-gold-hover font-semibold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Report this issue to Editorial
          </Link>
        </div>
      </div>
    </div>
  );
}
