/**
 * Single ESLint config for the whole repo.
 *
 * The root block targets the browser SPA under `src/` (TypeScript, ESM).
 * The override block targets `functions/` — Cloud Functions source, which is
 * Node 22 CommonJS. Without that override the shared config reports every
 * `require` and `exports` as `no-undef`, which is why the lint script used to
 * be scoped to `--ext ts,tsx` and left the functions source — the only code in
 * this project that writes Firestore with admin credentials — unchecked.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
    '**/*.timestamp-*.mjs',
    '.claude/worktrees',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      files: ['functions/**/*.js'],
      env: { node: true, browser: false, es2022: true },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
      rules: {
        // CommonJS is the deployment format for Cloud Functions, not a smell.
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: { node: true, browser: true, es2022: true },
    },
  ],
};
