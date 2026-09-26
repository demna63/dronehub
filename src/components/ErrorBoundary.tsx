
import React, { ErrorInfo, ReactNode } from 'react';
import { useLanguage } from '../contexts/useLanguage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in their child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
/**
 * The fallback is its own function component because the boundary itself has to
 * be a class — `getDerivedStateFromError` has no hook equivalent — and a class
 * cannot call `useLanguage`.
 */
const ErrorFallback: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-40 bg-surface/30 border border-white/5 rounded-2xl text-center">
      <div className="text-6xl mb-6">🛰️</div>
      <h2 className="text-2xl font-extrabold text-white mb-4">{t('error_title')}</h2>
      <p className="text-ink-3 max-w-sm mx-auto mb-8 font-medium">
        {t('error_body')}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-10 py-4 bg-accent-fill hover:bg-accent-fill-hover text-white font-extrabold rounded-2xl text-xs transition-all shadow-xl"
      >
        {t('error_reload')}
      </button>
    </div>
  );
};

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  constructor(props: Props) {
    super(props); // super(props) handles this.props assignment — no manual override needed
    this.state = { hasError: false };
  }

  // Static method for updating state based on errors. This is required for React error boundaries.
  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // Standard lifecycle method for logging errors. Used for side effects like error reporting.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console for debugging purposes.
    console.error("Uncaught error:", error, errorInfo);
  }

  // Render method correctly accesses this.state and this.props inherited from the Component class.
  public render(): ReactNode {
    // Accessing state and props inherited from React.Component.
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return <ErrorFallback />;
    }

    // Correctly return children prop when no error is present.
    return children;
  }
}

export default ErrorBoundary;
