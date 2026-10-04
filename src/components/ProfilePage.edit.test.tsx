// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import type { User } from '../types';

const getDoc = vi.fn();
const getDocs = vi.fn();

vi.mock('../lib/firebase', () => ({ db: {} }));
vi.mock('../services/apiService', () => ({ apiService: {} }));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: (...args: unknown[]) => getDoc(...args),
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  getDocs: (...args: unknown[]) => getDocs(...args),
}));
vi.mock('./EditProfileModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog">editor</div> : null),
}));

import ProfilePage from './ProfilePage';

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

const renderProfile = (path: string, currentUser: User | null, authPending = false) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/u/:userId"
            element={(
              <>
                <LocationProbe />
                <ProfilePage currentUser={currentUser} authPending={authPending} />
              </>
            )}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );

beforeEach(() => {
  getDoc.mockReset();
  getDocs.mockReset();
  getDoc.mockResolvedValue({
    exists: () => true,
    id: 'pilot-1',
    data: () => ({ name: 'დიმა', email: 'pilot@example.com', avatar: '', reputation: 200 }),
  });
  getDocs.mockResolvedValue({ docs: [] });
});

afterEach(cleanup);

describe('profile editor from the account menu', () => {
  it('opens the editor for the signed-in pilot and drops the flag', async () => {
    renderProfile('/u/pilot-1?edit=1', viewer);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('loc')).toHaveTextContent('/u/pilot-1');
      expect(screen.getByTestId('loc').textContent).not.toContain('edit=1');
    });
  });

  it('does not open another pilot\'s editor', async () => {
    renderProfile('/u/pilot-1?edit=1', { ...viewer, id: 'other' });

    expect(await screen.findByRole('heading', { name: 'დიმა' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('loc').textContent).not.toContain('edit=1');
    });
  });

  it('waits until auth settles before dropping the flag', async () => {
    const { rerender } = render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/u/pilot-1?edit=1']}>
          <Routes>
            <Route
              path="/u/:userId"
              element={(
                <>
                  <LocationProbe />
                  <ProfilePage currentUser={null} authPending />
                </>
              )}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'დიმა' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('loc')).toHaveTextContent('edit=1');

    rerender(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/u/pilot-1?edit=1']}>
          <Routes>
            <Route
              path="/u/:userId"
              element={(
                <>
                  <LocationProbe />
                  <ProfilePage currentUser={viewer} authPending={false} />
                </>
              )}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
