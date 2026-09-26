import React, { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Rendered as the dialog's accessible name. */
  title: string;
  /** Hide the title visually while keeping it for assistive tech. */
  hideTitle?: boolean;
  children: React.ReactNode;
  /** Tailwind max-width class for the panel. */
  size?: string;
  /** Set while a write is in flight: blocks Escape and backdrop dismissal. */
  busy?: boolean;
  footer?: React.ReactNode;
  /**
   * `center` is the ordinary dialog. `fullscreen` fills the viewport and has
   * no header border — used by the mobile menu, which still needs the focus
   * trap, Escape and scroll lock this component owns.
   */
  variant?: 'center' | 'fullscreen';
  /** Leading header content (e.g. the logo) in the `fullscreen` variant. */
  headerStart?: React.ReactNode;
  /** Control to focus on open instead of the first focusable one. */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * The one dialog primitive.
 *
 * Before this, not a single modal in the app had `role="dialog"`, `aria-modal`,
 * a focus trap or an Escape handler — `tabIndex` appeared zero times in the
 * whole codebase. Focus stayed behind the overlay, Tab walked out into the page
 * underneath, Escape did nothing, and closing never returned focus to whatever
 * opened the dialog.
 *
 * `busy` exists because a dialog that can be dismissed mid-write loses the
 * user's input to a request they can no longer see the result of.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  hideTitle = false,
  children,
  size = 'max-w-lg',
  busy = false,
  footer,
  variant = 'center',
  headerStart,
  initialFocusRef,
}) => {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Whatever had focus when the dialog opened, so it can be handed back.
  const openerRef = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  /**
   * The effect below must run ONCE per open, so `requestClose` reaches it
   * through a ref rather than a dependency.
   *
   * As a dependency it was catastrophic: consumers pass an inline
   * `onClose={() => setOpen(false)}`, so every parent render minted a new
   * identity, tore the effect down (restoring focus to the element behind the
   * overlay) and re-ran it (focusing the dialog's first control). In the hangar
   * drone form — whose state lives in the parent — that fired on every
   * keystroke, so the input lost focus after each character and the form could
   * not be filled in at all. `busy` changing on submit did the same.
   */
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!isOpen) return;

    // Captured once per open. Reassigning it on a re-run recorded an element
    // INSIDE the dialog as the opener, so closing dropped focus to <body>
    // instead of returning it — the exact bug this ref exists to prevent.
    openerRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    // Focus the first control, or the panel itself when it has none.
    const first = initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      // Cycle at the boundaries instead of escaping into the page behind.
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    // The page behind must not scroll under an open dialog.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      // Only if it is still in the document — an opener that unmounted with
      // the dialog would silently move focus to <body>.
      const opener = openerRef.current;
      if (opener && opener.isConnected) opener.focus();
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  const isFullscreen = variant === 'fullscreen';

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isFullscreen ? '' : 'p-4'}`}>
      {!isFullscreen && (
        <div
          aria-hidden="true"
          onClick={requestClose}
          className="absolute inset-0 bg-bg/80"
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={isFullscreen
          ? 'relative flex h-full w-full flex-col overflow-hidden bg-bg outline-none'
          : `relative w-full ${size} bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none`}
      >
        <div
          className={isFullscreen
            ? 'flex h-[60px] shrink-0 items-center gap-2 px-4'
            : 'p-5 border-b border-line flex justify-between items-center gap-4 shrink-0'}
        >
          {headerStart}
          <h2
            id={titleId}
            className={hideTitle || isFullscreen
              ? 'sr-only'
              : 'text-lg font-extrabold text-ink truncate'}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label={t('action_close')}
            className={`ml-auto shrink-0 flex items-center justify-center rounded-[10px] text-ink-2 hover:bg-white/5 hover:text-ink transition-colors disabled:opacity-40 ${isFullscreen ? 'h-11 w-11' : 'h-9 w-9'}`}
          >
            <X size={isFullscreen ? 22 : 20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>

        {footer && <div className="shrink-0 border-t border-line p-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
