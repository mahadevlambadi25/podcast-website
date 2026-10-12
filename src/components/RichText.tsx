import React from 'react';

interface RichTextProps {
  content: any;
  className?: string;
}

/**
 * Validates and sanitizes link targets to prevent script injection
 */
function sanitizeHref(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const trimmed = rawUrl.trim();

  // Allow relative links and hash fragments
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  // Allow only valid HTTP, HTTPS, or mailto protocols
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return trimmed;
    }
  } catch {
    return '#';
  }

  return '#';
}

/**
 * Basic HTML sanitizer to strip dangerous script tags and event handlers from raw strings
 */
function sanitizeHtmlString(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
}

export function RichText({ content, className = '' }: RichTextProps) {
  if (!content) return null;

  // If string (HTML or markdown or plain text)
  if (typeof content === 'string') {
    const sanitizedHtml = sanitizeHtmlString(content);
    return (
      <div
        className={`prose prose-gold max-w-none text-neu-body leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // If Lexical AST
  if (content.root && Array.isArray(content.root.children)) {
    return (
      <div className={`space-y-4 text-neu-body leading-relaxed ${className}`}>
        {content.root.children.map((node: any, idx: number) => renderNode(node, idx))}
      </div>
    );
  }

  return null;
}

function renderNode(node: any, index: number): React.ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'paragraph':
      return (
        <p key={index} className="text-neu-body leading-relaxed">
          {node.children?.map((child: any, i: number) => renderText(child, i))}
        </p>
      );

    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag) ? node.tag : 'h3') as
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5'
        | 'h6';
      return (
        <Tag key={index} className="font-editorial font-bold text-neu-charcoal tracking-tight mt-6 mb-2">
          {node.children?.map((child: any, i: number) => renderText(child, i))}
        </Tag>
      );
    }

    case 'list': {
      const ListTag = node.listType === 'bullet' ? 'ul' : 'ol';
      return (
        <ListTag key={index} className="list-disc list-inside space-y-1.5 pl-4 text-neu-body">
          {node.children?.map((item: any, i: number) => (
            <li key={i}>
              {item.children?.map((child: any, cIdx: number) => renderText(child, cIdx))}
            </li>
          ))}
        </ListTag>
      );
    }

    case 'quote':
      return (
        <blockquote key={index} className="border-l-2 border-neu-gold pl-4 italic text-neu-charcoal my-4 bg-neu-sunken/40 py-2 rounded-r-xl">
          {node.children?.map((child: any, i: number) => renderText(child, i))}
        </blockquote>
      );

    default:
      return (
        <div key={index}>
          {node.children?.map((child: any, i: number) => renderText(child, i))}
        </div>
      );
  }
}

function renderText(child: any, index: number): React.ReactNode {
  if (!child) return null;

  if (child.type === 'link') {
    const rawUrl = child.fields?.url || child.url;
    const safeUrl = sanitizeHref(rawUrl);
    const isExternal = safeUrl.startsWith('http://') || safeUrl.startsWith('https://');

    return (
      <a
        key={index}
        href={safeUrl}
        target={child.fields?.newTab || isExternal ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="text-neu-gold underline hover:text-neu-gold-hover font-medium transition-colors"
      >
        {child.children?.map((c: any, i: number) => renderText(c, i))}
      </a>
    );
  }

  const text = child.text || '';
  if (child.format & 1) {
    return <strong key={index} className="font-semibold text-neu-charcoal">{text}</strong>;
  }
  if (child.format & 2) {
    return <em key={index} className="italic text-neu-charcoal">{text}</em>;
  }

  return <span key={index}>{text}</span>;
}
