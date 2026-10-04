// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import type { User } from '../types';

vi.mock('../lib/firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));

import Navbar from './Navbar';

const viewer = {
  id: 'pilot-1',
  name: 'დიმა',
  email: 'pilot@example.com',
  avatar: '',
  reputation: 200,
} as User;

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="loc">{`${location.pathname}${location.search}`}</div>;
};

const renderBar = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <LocationProbe />
        <Routes>
          <Route path="*" element={<Navbar currentUser={viewer} />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );

afterEach(cleanup);

describe('account menu settings', () => {
  it('opens the signed-in profile editor and paints the menu above the page', async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole('button', { name: /მომხმარებლის მენიუ/ }));
    const settings = screen.getByRole('button', { name: /პარამეტრები/ });
    // The panel is portaled to <body>, outside the h-16 header, so the feed
    // column underneath cannot take the click.
    expect(settings.parentElement?.parentElement).toBe(document.body);
    expect(document.querySelector('header')?.contains(settings)).toBe(false);

    await user.click(settings);
    expect(screen.getByTestId('loc')).toHaveTextContent('/u/pilot-1?edit=1');
  });

  it('keeps Profile on the profile page without the editor flag', async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole('button', { name: /მომხმარებლის მენიუ/ }));
    await user.click(screen.getByRole('button', { name: /პროფილი/ }));
    expect(screen.getByTestId('loc')).toHaveTextContent('/u/pilot-1');
    expect(screen.getByTestId('loc').textContent).not.toContain('edit=1');
  });
});
