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
const ALLOWED = new Set([
  'utils/translations.ts',
  'constants/stlCatalogData.ts',
  'constants/droneRegulations.ts',
]);

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

/**
 * Text between a closing `>` and the next `<` or `{`. The lookbehind skips
 * `=>` and `->`; the excluded characters keep code (calls, comparisons,
 * strings) from matching as text.
 */
const jsxText = (code: string): string[] =>
  [...code.matchAll(/(?<![=-])>([^<>{}();=&|?`'"]+?)(?=[<{])/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);

const findGeorgian = (source: string): string[] => {
  const code = stripComments(source);
  const hits: string[] = [];

  // String literals.
  for (const match of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) {
    const value = match[1] ?? match[2] ?? '';
    if (GEORGIAN.test(value)) hits.push(value);
  }
  // JSX text nodes, including text that runs up to an expression
  // (`ბრიგვა: {value}` slipped through a `>…<`-only match) and text that
  // spans lines.
  for (const text of jsxText(code)) {
    if (GEORGIAN.test(text)) hits.push(text);
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

/**
 * English text written into JSX has the same effect in reverse: a Georgian
 * reader sees "All Spots", "Login to transmit". These components were
 * rewritten in the 2026-09 design pass and are held to it (F8).
 */
const ENGLISH_CHECKED = [
  'components/Sidebar.tsx',
  'components/SidebarNavSection.tsx',
  'components/EcosystemLinksNav.tsx',
  'components/SpotMap.tsx',
  'components/GlobalChat.tsx',
  'components/ChatRoom.tsx',
  'components/ToolsHub.tsx',
  'components/RightSidebar.tsx',
  'components/RightSidebarSection.tsx',
  'components/RightSidebarWeatherCard.tsx',
  'components/Navbar.tsx',
  'components/NavbarLinks.tsx',
  'components/Feed.tsx',
  'components/PostRow.tsx',
  'components/PageHeader.tsx',
  'components/FlightStatusStrip.tsx',
  'components/MarketplaceList.tsx',
  'components/MarketplaceCard.tsx',
  'components/MarketplaceFilters.tsx',
];

/** Names, codes and identifiers that are the same in every language. */
const LANGUAGE_NEUTRAL = new Set([
  'GE / EN',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_GOOGLE_MAPS_ID',
]);

describe('no hardcoded English in the redesigned components', () => {
  for (const file of ENGLISH_CHECKED) {
    it(`${file} routes its text through t()`, () => {
      const code = stripComments(readFileSync(join(SRC, file), 'utf8'));
      const hits = jsxText(code).filter((text) => /[A-Za-z]{2}/.test(text) && !LANGUAGE_NEUTRAL.has(text));
      // Visible attribute text: placeholder, aria-label, title, alt.
      for (const match of code.matchAll(/\b(?:placeholder|aria-label|title|alt)="([^"]*[A-Za-z]{2}[^"]*)"/g)) {
        hits.push(match[1]);
      }
      expect(hits, `move these into translations.ts and use t():\n  ${hits.join('\n  ')}`).toEqual([]);
    });
  }
});
