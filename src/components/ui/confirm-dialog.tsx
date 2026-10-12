'use client';

import React from 'react';
import { Dialog } from './dialog';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  isDestructive = true,
  variant,
  isLoading = false,
}) => {
  const displayMessage = message || description || '';
  const finalConfirmLabel = confirmText || confirmLabel || 'Confirm';
  const finalCancelLabel = cancelText || cancelLabel || 'Cancel';
  const destructive = isDestructive || variant === 'danger';
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-3 my-2">
        {destructive && (
          <div className="p-2 rounded-full bg-red-100 text-red-600 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-slate-600 leading-relaxed">{displayMessage}</p>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
          {finalCancelLabel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          size="md"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {finalConfirmLabel}
        </Button>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
