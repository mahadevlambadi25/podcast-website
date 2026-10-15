import React from 'react';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  staggerIndex?: number;
}

export function ScrollReveal({
  children,
  as: Component = 'div',
  className = '',
  staggerIndex,
  ...props
}: ScrollRevealProps) {
  return (
    <Component
      data-reveal
      {...(staggerIndex ? { 'data-reveal-delay': Math.min(Math.max(staggerIndex, 1), 8) } : {})}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
