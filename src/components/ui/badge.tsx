import React from 'react';
import { ShieldCheck, UserCog, CheckCircle, Clock, Archive, Sparkles, AlertCircle } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'admin' | 'editor' | 'published' | 'draft' | 'scheduled' | 'archived' | 'pending' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  showTooltip?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  showTooltip = true,
  children,
  className = '',
  ...props
}) => {
  // Role specific configurations
  if (variant === 'admin') {
    return (
      <span
        title={showTooltip ? 'Administrator: Full platform access, security, site settings, and team management' : undefined}
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F1B2D] text-[#C9A24B] border border-[#C9A24B]/40 shadow-xs cursor-default ${className}`}
        {...props}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#C9A24B]" />
        <span>{children || 'Administrator'}</span>
      </span>
    );
  }

  if (variant === 'editor') {
    return (
      <span
        title={showTooltip ? 'Editor: Content creation, episode publishing, guest management, and media curation' : undefined}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs cursor-default ${className}`}
        {...props}
      >
        <UserCog className="w-3.5 h-3.5 text-blue-600" />
        <span>{children || 'Editor'}</span>
      </span>
    );
  }

  const variantStyles = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-300',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const icons = {
    published: <CheckCircle className="w-3 h-3 text-emerald-600" />,
    draft: <Clock className="w-3 h-3 text-amber-600" />,
    scheduled: <Clock className="w-3 h-3 text-indigo-600" />,
    archived: <Archive className="w-3 h-3 text-slate-500" />,
    pending: <AlertCircle className="w-3 h-3 text-amber-600" />,
    success: <CheckCircle className="w-3 h-3 text-emerald-600" />,
    warning: <AlertCircle className="w-3 h-3 text-amber-600" />,
    danger: <AlertCircle className="w-3 h-3 text-red-600" />,
    info: <Sparkles className="w-3 h-3 text-sky-600" />,
    default: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icons[variant]}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
