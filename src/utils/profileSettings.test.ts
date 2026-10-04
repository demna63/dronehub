import { describe, expect, it } from 'vitest';
import { profileSettingsPath, shouldOpenProfileEditor } from './profileSettings';

describe('profileSettingsPath', () => {
  it('points at the signed-in profile with the editor flag', () => {
    expect(profileSettingsPath('pilot-1')).toBe('/u/pilot-1?edit=1');
  });
});

describe('shouldOpenProfileEditor', () => {
  it('opens only for the signed-in pilot on their own profile', () => {
    expect(shouldOpenProfileEditor('1', 'pilot-1', 'pilot-1')).toBe(true);
  });

  it('stays closed without the flag, signed out, or on another profile', () => {
    expect(shouldOpenProfileEditor(null, 'pilot-1', 'pilot-1')).toBe(false);
    expect(shouldOpenProfileEditor('1', null, 'pilot-1')).toBe(false);
    expect(shouldOpenProfileEditor('1', undefined, 'pilot-1')).toBe(false);
    expect(shouldOpenProfileEditor('1', 'pilot-1', 'other')).toBe(false);
    expect(shouldOpenProfileEditor('1', 'pilot-1', null)).toBe(false);
  });
});
