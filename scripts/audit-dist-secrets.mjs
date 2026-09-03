#!/usr/bin/env node
/**
 * Post-build guard: fail if production dist/ ships secret material.
 * Run automatically after `vite build` via npm run build.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const JS_EXT = /\.(js|mjs|cjs)$/i;

const FORBIDDEN = [
  { label: 'Gemini API key in bundle', pattern: /VITE_GEMINI_API_KEY\s*[:=]\s*["']AIza[A-Za-z0-9_-]{20,}/ },
  { label: 'Gemini direct API call with key', pattern: /generativelanguage\.googleapis\.com[^"']*key=AIza/ },
  { label: 'Service account private key', pattern: /"private_key"\s*:\s*"-----BEGIN/ },
  { label: 'Anthropic API key', pattern: /sk-ant-[A-Za-z0-9_-]{20,}/ },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (JS_EXT.test(entry.name)) files.push(path);
  }
  return files;
}

async function main() {
  let files;
  try {
    files = await walk(DIST);
  } catch {
    console.error('audit-dist-secrets: dist/ not found — run vite build first');
    process.exit(1);
  }

  const violations = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(content)) {
        violations.push({ file, label: rule.label });
      }
    }
  }

  if (violations.length) {
    console.error('SECURITY: dist/ contains forbidden secret material:\n');
    for (const v of violations) {
      console.error(`  • ${v.label} → ${v.file}`);
    }
    console.error('\nDo not deploy. Rotate any exposed keys before rebuilding.');
    process.exit(1);
  }

  console.log(`audit-dist-secrets: OK (${files.length} JS files scanned)`);
}

main();
