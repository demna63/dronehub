import { describe, expect, it } from 'vitest';
import { canManageComment } from './authUtils';
import type { Comment, User } from '../types';

const user = (id: string, isAdmin = false) => ({ id, isAdmin } as User);
const comment = (authorId: string) => ({ authorId } as Comment);

describe('canManageComment', () => {
  it('allows the author', () => {
    expect(canManageComment(user('u1'), comment('u1'))).toBe(true);
  });

  it('allows an admin on someone else’s comment', () => {
    expect(canManageComment(user('u2', true), comment('u1'))).toBe(true);
  });

  it('denies a different non-admin user', () => {
    expect(canManageComment(user('u2'), comment('u1'))).toBe(false);
  });

  it('denies anonymous visitors', () => {
    expect(canManageComment(null, comment('u1'))).toBe(false);
  });

  it('denies when the comment has no author (legacy documents)', () => {
    expect(canManageComment(user('u1'), comment(undefined as unknown as string))).toBe(false);
    expect(canManageComment(user('u1'), null)).toBe(false);
  });
});
