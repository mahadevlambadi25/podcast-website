import React from 'react';
import { LucideIcon, Search, Plus } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 my-6 rounded-2xl bg-slate-50/60 border border-dashed border-slate-300">
      <div className="relative mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs">
        <Icon className="w-7 h-7 text-[#C9A24B]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0F1B2D] border-2 border-white flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
        </div>
      </div>

      <h3 className="font-serif text-lg font-bold text-slate-800">{title}</h3>
      <p className="max-w-md text-sm text-slate-500 mt-1 mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" icon={ActionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
