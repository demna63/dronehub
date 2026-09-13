import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

/**
 * The context object and its hook live apart from `ToastProvider` so that the
 * provider module exports nothing but a component. A module that mixes
 * components with other exports loses React Fast Refresh — an edit to the
 * provider forces a full page reload instead of a hot swap, and every toast,
 * form and route state in the app is thrown away with it.
 */
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
