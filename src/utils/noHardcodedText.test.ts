import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guard against the failure this whole translation pass existed to fix.
 *
 * The language toggle was never broken — it flipped the language, persisted it
 * and re-rendered. What was broken is that 8 of 69 components asked for a
 * translation and the other 61 had Georgian written directly into the JSX, so
 * the only visible effect of the switch was a GE/EN badge.
 *
 * This test fails the build when Georgian text appears anywhere outside the
 * translation tables. Comments are exempt — explaining code in Georgian is
 * fine; shipping it to an English reader is not.
 */
const SRC = resolve(__dirname, '..');
const GEORGIAN = /[\u10A0-\u10FF]/;

/** Files that legitimately contain Georgian. */
const ALLOWED = new Set(['utils/translations.ts']);

/**
 * Test files are exempt. They carry Georgian fixtures on purpose — a query for
 * the default-language label, a mirror comparison against functions/index.js —
 * and none of it ships to a user.
 */
const isTest = (file: string) => /\.test\.tsx?$/.test(file);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });

/** Strip block and line comments so documentation prose is not flagged. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const findGeorgian = (source: string): string[] => {
  const code = stripComments(source);
  const hits: string[] = [];

  // String literals.
  for (const match of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) {
    const value = match[1] ?? match[2] ?? '';
    if (GEORGIAN.test(value)) hits.push(value);
  }
  // JSX text nodes.
  for (const match of code.matchAll(/>\s*([^<>{}\n]+?)\s*</g)) {
    if (GEORGIAN.test(match[1])) hits.push(match[1]);
  }
  // Template literals.
  for (const match of code.matchAll(/`([^`]*)`/g)) {
    if (GEORGIAN.test(match[1])) hits.push(match[1].slice(0, 60));
  }
  return hits;
};

describe('no hardcoded Georgian outside the translation tables', () => {
  const files = walk(SRC)
    .map((file) => relative(SRC, file).split('\\').join('/'))
    .filter((file) => !ALLOWED.has(file) && !isTest(file));

  it('scans a plausible number of files', () => {
    // A broken walk that finds nothing would make every assertion below pass.
    expect(files.length).toBeGreaterThan(50);
  });

  for (const file of files) {
    it(`${file} routes its text through t()`, () => {
      const hits = findGeorgian(readFileSync(join(SRC, file), 'utf8'));
      expect(hits, `move these into translations.ts and use t():\n  ${hits.join('\n  ')}`).toEqual([]);
    });
  }
});
