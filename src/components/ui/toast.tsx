'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: { type: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: { type: ToastType; title: string; message?: string; duration?: number }) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-white border-emerald-500/40 text-slate-800 shadow-[0_8px_20px_rgba(16,185,129,0.15)]',
            error: 'bg-white border-red-500/40 text-slate-800 shadow-[0_8px_20px_rgba(239,68,68,0.15)]',
            info: 'bg-white border-blue-500/40 text-slate-800 shadow-[0_8px_20px_rgba(59,130,246,0.15)]',
          };

          const icons = {
            success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${typeStyles[t.type]} animate-in slide-in-from-bottom-5 duration-200 transition-all`}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 rounded-md p-0.5 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      toast: console.log,
      success: (t: string) => console.log('Toast success:', t),
      error: (t: string) => console.error('Toast error:', t),
    };
  }
  return context;
};

export default ToastProvider;
