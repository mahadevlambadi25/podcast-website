import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    // Variant styles
    const variantStyles = {
      primary:
        'bg-[#C9A24B] hover:bg-[#B89248] text-[#0F1B2D] font-semibold shadow-sm hover:shadow-[0_4px_14px_rgba(201,162,75,0.3)] border border-[#C9A24B]/40 active:bg-[#A88132]',
      gold:
        'bg-gradient-to-r from-[#DFBF7C] via-[#C9A24B] to-[#B89248] hover:from-[#E5C678] hover:to-[#C9A24B] text-[#0F1B2D] font-bold shadow-md hover:shadow-[0_6px_20px_rgba(201,162,75,0.4)] border border-white/20',
      secondary:
        'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm hover:border-slate-300',
      outline:
        'bg-transparent hover:bg-slate-100/60 text-slate-700 border border-slate-300',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
      destructive:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] border border-red-700/50',
    };

    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
      lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
      icon: 'p-2 rounded-xl h-9 w-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
