// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import Modal from './Modal';

// Vitest runs without `globals`, so React Testing Library's automatic cleanup
// hook is never registered. Without this each test leaves its tree mounted and
// the next one queries a document containing several dialogs.
afterEach(cleanup);

/**
 * These cover the four defects that shipped in `Modal` and were each caught by
 * eye rather than by a test. Every case below fails against the version that
 * had the bug.
 */

/** A parent that re-renders on every keystroke and passes an inline `onClose`. */
const StatefulHost: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [text, setText] = useState('');
  return (
    <Modal isOpen onClose={onClose ?? (() => {})} title="Drone">
      <input
        aria-label="name"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="button">Save</button>
    </Modal>
  );
};

describe('Modal', () => {
  it('keeps focus in the field while the parent re-renders on every keystroke', async () => {
    const user = userEvent.setup();
    render(<StatefulHost />);

    const input = screen.getByLabelText('name');
    await user.click(input);
    await user.type(input, 'Quad');

    // The regression: the open-effect re-ran on each parent render and moved
    // focus to the dialog's first control, so only the first character landed.
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Quad');
  });

  it('returns focus to the element that opened it', async () => {
    const user = userEvent.setup();

    const Host: React.FC = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open</button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Drone">
            <button type="button">Inside</button>
          </Modal>
        </>
      );
    };

    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'დახურვა' }));
    expect(opener).toHaveFocus();
  });

  it('closes on Escape, and refuses to while busy', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen onClose={onClose} title="Drone" busy>
        <button type="button">Inside</button>
      </Modal>,
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <Modal isOpen onClose={onClose} title="Drone">
        <button type="button">Inside</button>
      </Modal>,
    );
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores body scrolling when it unmounts', () => {
    const { unmount } = render(
      <Modal isOpen onClose={() => {}} title="Drone">
        <button type="button">Inside</button>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('exposes the title as the dialog accessible name even when hidden', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Drone" hideTitle>
        <button type="button">Inside</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Drone' })).toBeInTheDocument();
  });
});
