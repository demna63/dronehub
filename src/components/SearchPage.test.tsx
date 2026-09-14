// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import type { Post } from '../types';

const searchPosts = vi.fn();

// The service is mocked at the module boundary: this suite is about the page's
// URL handling and states, not about Firestore.
vi.mock('../services/apiService', () => ({
  apiService: { searchPosts: (...args: [string]) => searchPosts(...args) },
}));

// PostCard reaches into Firebase and framer-motion; neither is under test here.
vi.mock('./PostCard', () => ({
  default: ({ post }: { post: Post }) => <article data-testid="post">{post.title}</article>,
}));
vi.mock('./PostCardSkeleton', () => ({ default: () => <div data-testid="skeleton" /> }));

import SearchPage from './SearchPage';

const post = (id: string, title: string): Post => ({ id, title } as Post);

// SearchPage reads its labels through useLanguage, so the provider is part of
// the component's contract rather than optional test scaffolding.
const renderAt = (path: string) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/search"
            element={<SearchPage currentUser={null} onLoginClick={() => {}} />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );

beforeEach(() => {
  // Block body on purpose: a concise arrow returns the mock, and Vitest treats
  // a function returned from beforeEach as a teardown callback — it would then
  // invoke the mock after each test and reject into nothing.
  searchPosts.mockReset();
});
afterEach(cleanup);

describe('SearchPage', () => {
  it('runs the query taken from ?q= on mount', async () => {
    searchPosts.mockResolvedValue([post('1', 'Cinewhoop build')]);
    renderAt('/search?q=cinewhoop');

    await waitFor(() => expect(searchPosts).toHaveBeenCalledWith('cinewhoop'));
    expect(await screen.findByText('Cinewhoop build')).toBeInTheDocument();
    expect(screen.getByLabelText('ძებნა')).toHaveValue('cinewhoop');
  });

  it('does not search when there is no query', () => {
    renderAt('/search');
    expect(searchPosts).not.toHaveBeenCalled();
  });

  it('treats a whitespace-only query as empty', () => {
    renderAt('/search?q=%20%20');
    expect(searchPosts).not.toHaveBeenCalled();
  });

  it('puts a submitted query in the URL rather than in local state', async () => {
    const user = userEvent.setup();
    searchPosts.mockResolvedValue([]);
    renderAt('/search');

    await user.type(screen.getByLabelText('ძებნა'), 'gopro{Enter}');
    // The page must read its query back out of the URL, so that a result page
    // is linkable and the back button steps through searches.
    await waitFor(() => expect(searchPosts).toHaveBeenCalledWith('gopro'));
  });

  it('surfaces a failure instead of rendering an empty result set', async () => {
    // `mockRejectedValue` builds its rejected promise at setup time, which Node
    // flags as unhandled in the microtask before the component attaches its
    // catch. Building it per call inside the implementation avoids that.
    searchPosts.mockImplementation(() => Promise.reject(new Error('firestore unavailable')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt('/search?q=fpv');

    expect(await screen.findByText('ძებნა ვერ შესრულდა.')).toBeInTheDocument();
    expect(screen.queryAllByTestId('post')).toHaveLength(0);
  });

  it('re-runs the search when the retry button is pressed', async () => {
    const user = userEvent.setup();
    searchPosts.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt('/search?q=fpv');

    await screen.findByText('ძებნა ვერ შესრულდა.');
    searchPosts.mockResolvedValue([post('2', 'FPV freestyle')]);
    await user.click(screen.getByRole('button', { name: 'ხელახლა ცდა' }));

    expect(await screen.findByText('FPV freestyle')).toBeInTheDocument();
  });
});
