// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import StarRating from './StarRating';
import { RATING_STARS } from '../utils/telemetry';

afterEach(cleanup);

describe('StarRating', () => {
  it('renders five real buttons when interactive and reports 1-based values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} label="Utility" />);

    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(RATING_STARS);

    await user.click(stars[3]);
    // Fourth button means four stars, not index 3.
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks exactly the stars up to the current value as pressed', () => {
    render(<StarRating value={3} onChange={() => {}} label="Skill" />);
    const pressed = screen.getAllByRole('button').map((b) => b.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['true', 'true', 'true', 'false', 'false']);
  });

  it('is read-only with no buttons when onChange is omitted', () => {
    render(<StarRating value={4.2} label="Vision" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    // A fractional average must be announced as such, not rounded to 4 or 5.
    expect(screen.getByRole('img', { name: `Vision: 4.2 / ${RATING_STARS}` })).toBeInTheDocument();
  });

  it('does not fire onChange while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} disabled label="Utility" />);

    // `disabled` makes it read-only, so there is nothing to click.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    await user.click(screen.getByRole('img', { name: /Utility/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps a click inside a clickable card from bubbling to the card', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    const onChange = vi.fn();
    render(
      <div onClick={onCardClick}>
        <StarRating value={0} onChange={onChange} label="Utility" />
      </div>,
    );

    await user.click(screen.getAllByRole('button')[0]);
    expect(onChange).toHaveBeenCalledWith(1);
    // Rating a post from the feed must not also navigate into it.
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
