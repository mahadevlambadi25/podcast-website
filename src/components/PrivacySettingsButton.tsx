'use client';

import React from 'react';

export function PrivacySettingsButton() {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open_cookie_preferences'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block text-left text-xs text-neu-muted hover:text-neu-charcoal transition-colors focus:outline-none focus-visible:underline font-medium"
      aria-label="Reopen cookie and privacy choices"
    >
      Privacy Settings
    </button>
  );
}
