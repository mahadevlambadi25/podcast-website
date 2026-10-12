'use client';

import React, { useState } from 'react';
import { Share2, Linkedin, Mail, Link as LinkIcon, Check, MessageSquare } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  summary?: string;
}

export function ShareButtons({ url, title, summary }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary || title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const shareLinks = [
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
      color: 'hover:text-blue-400',
    },
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: MessageSquare,
      color: 'hover:text-emerald-400',
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedSummary}%0A%0AListen%20here:%20${encodedUrl}`,
      icon: Mail,
      color: 'hover:text-amber-400',
    },
  ];

  return (
    <div className="flex items-center flex-wrap gap-2 text-xs">
      <span className="text-neu-muted flex items-center gap-1.5 font-semibold mr-1">
        <Share2 className="w-3.5 h-3.5 text-neu-gold" />
        Share:
      </span>

      {shareLinks.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${item.name}`}
            className={`p-2 rounded-xl neu-btn text-neu-charcoal transition-all ${item.color} focus:outline-none`}
          >
            <Icon className="w-4 h-4" />
          </a>
        );
      })}

      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="Copy canonical link to clipboard"
        className="px-3.5 py-2 rounded-xl neu-btn text-neu-charcoal hover:text-neu-gold transition-all flex items-center gap-1.5 focus:outline-none font-medium"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5 text-neu-muted" />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}
