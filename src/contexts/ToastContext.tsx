import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext, type ToastType } from './useToast';
import { useLanguage } from './useLanguage';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const TOAST_MS = 4000;

const TONE: Record<ToastType, { chip: string; Icon: typeof CheckCircle2 }> = {
  success: { chip: 'bg-emerald-500/20 text-emerald-400', Icon: CheckCircle2 },
  error: { chip: 'bg-rose-500/20 text-rose-400', Icon: AlertCircle },
  info: { chip: 'bg-accent-tint text-accent', Icon: Info },
};

/**
 * App-wide toasts.
 *
 * Deliberately dependency-free. The previous version imported framer-motion for
 * a fade-and-rise, and because this provider wraps the entire tree that pulled
 * a 110 KB library (36 KB gzipped) into the eager first-load bundle — every
 * other framer-motion consumer in the app already sits inside a lazy route
 * chunk. The same motion is one CSS keyframe.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Ids were `Date.now().toString()`: two toasts raised in the same millisecond
  // collided, and dismissing one removed both.
  const nextId = useRef(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    nextId.current += 1;
    const id = `toast-${nextId.current}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    timers.current.set(id, setTimeout(() => removeToast(id), TOAST_MS));
  }, [removeToast]);

  // Pending timers would otherwise fire setState after unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  // A fresh object here re-renders every consumer of this whole-app provider.
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => {
          const { chip, Icon } = TONE[toast.type];
          return (
            <div
              key={toast.id}
              className="animate-toast-enter pointer-events-auto min-w-[300px] max-w-sm bg-surface/90 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <span className={`p-2 rounded-full shrink-0 ${chip}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-white flex-1">{toast.message}</p>
              <button
                type="button"
                aria-label={t('action_close')}
                onClick={() => removeToast(toast.id)}
                className="text-ink-3 hover:text-white transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
