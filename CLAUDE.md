# CLAUDE.md — dronehub.ge (community site)

## რა არის ეს პროექტი
**dronehub.ge** — DroneHub Georgia-ს ქართული FPV/დრონების community საიტი.
ფუნქციები: რუკა, პოსტები, ხელსაწყოები, marketplace, chat, wiki.
Hosting: **Firebase** (`dronehubgeorgia-a7bd5` → `dronehub.ge`).

## სტეკი
- React 18 + TypeScript + Vite 7
- Tailwind CSS 3, Framer Motion
- Firebase 13: Auth, Firestore, Storage, Hosting, Functions (Node 22, firebase-admin 14, firebase-functions 7)
- Google Maps via `@vis.gl/react-google-maps` (რუკა; Maps JS API loads at runtime)
- React Router v7, custom i18n (ka/en)
- Vitest 4 + Testing Library, ESLint 8 + typescript-eslint 8

## Build / Dev / Deploy
```bash
npm install
npm run dev          # port 4173
npm run build
npm run deploy:hosting
firebase deploy --only firestore:rules,storage:rules,functions  # rules/functions
```
**Deploy order: functions before hosting.** `firebase.json` rewrites `/post/**` to the
`postMeta` function; Hosting refuses a release whose rewrite names a function that
does not exist yet.

## არქიტექტურა
- `src/components/` — UI
- `src/routes/AppRoutes.tsx` — routing
- `src/components/ToolsHub.tsx` — nested `/tools/*` tools
- `src/config/ecosystemLinks.ts` — cross-site nav (main, PID, VTX)
- `src/lib/firebase/` — Firebase init
- `functions/index.js` — `geminiProxy` (production AI), `ratePostV2`, `onCommentCreated`/
  `onCommentDeleted`, `backfillPosts`, `postMeta`
- `functions/postMeta.js` — per-post `<head>` for posts created since the last deploy, and a
  real 404 for unknown post ids
- `build/seoPrerender.ts` — Vite plugin: writes `dist/<path>/index.html` per sitemap URL,
  `dist/app-shell.html` (no canonical) and `dist/404.html` (noindex)
- `src/utils/routeMeta.ts` — route → title/description/canonical, shared by the prerender
  and `PageMeta`
- `src/lib/firebase/storage.ts`, `functions.ts` — lazily loaded Storage / Functions SDKs
- `public/` — PWA, brand assets

## ეკოსისტემა
- **dronehub.ge** — community hub + lightweight RF tools
- **pid-dronehub.ge** — PID calculator / blackbox analyzer
- **vtx-dronehub.web.app** — VTX table generator

PID/VTX/Betaflight presets აღარ არის main-ში — external redirect + ecosystem nav.

## სამუშაო წესი
- UI dark theme (`#020617`), bilingual ka/en
- Firestore security rules ცვლილებებზე ფრთხილად
- Secrets არ უნდა მოხვდეს client bundle-ში (Gemini → Functions proxy prod-ში)

## Lint ratchet
The ratchet reached zero: `npm run lint` now runs with `--max-warnings 0`, the same
as `lint:strict`. Any new warning fails the build. CI runs `lint` and `test` on every PR.

## Invariants worth knowing before editing
- **Ratings**: `telemetry`, `telemetryScore` and `posts/{id}/votes/*` are written ONLY by
  the `ratePostV2` Cloud Function. `firestore.rules` forbids client writes, so the
  aggregate can never disagree with the votes behind it.
- **commentsCount** is owned by the `onCommentCreated`/`onCommentDeleted` triggers.
  A commenter is usually not the post's author, so the client cannot maintain it.
- **Constants duplicated by necessity** (`PRIOR_MEAN`, `PRIOR_WEIGHT`, the rating scale,
  the input length caps) live in both `src/utils/telemetry.ts` / `src/constants/limits.ts`
  and in `functions/index.js` / `firestore.rules`. `src/utils/constants.mirror.test.ts`
  fails the build if they drift.
- **Timestamps**: always read `createdAt` through `toDate()` in `src/utils/dates.ts`.
  Firestore returns a `Timestamp`; `new Date(that)` is an Invalid Date, and `date-fns`
  throws a RangeError on one.
- **Dialogs**: use `src/components/Modal.tsx`. It owns the focus trap, Escape, focus
  restore and scroll lock. Never hand-roll an overlay.
- **Avatars**: use `src/components/Avatar.tsx` — it handles a broken `src` and falls
  back to the DroneHub "D" mark.
- **Hosting routes**: the app-shell rewrite in `firebase.json` is a regex over the SPA's
  route table; anything else gets `404.html` with a real 404. Adding a `<Route>` without
  updating that regex makes it 404 on a hard refresh — `src/routes/hostingRoutes.test.ts`
  fails the build when they drift.
- **Storage uploads are create-only** in shared folders (`posts/`, `market/`, `avatars/`,
  `builds/`, `stl_*`): every upload gets a fresh `${Date.now()}_name` path and the client
  never overwrites or deletes. `spots/{uid}/` is owner-writable.
- **Votes are private**: `posts/{id}/votes/{uid}` is readable only by its owner (or admin).
- **No `alert()` / `window.confirm()`.** Use `useToast()` and the inline two-step
  confirm pattern (see `CommentBody.tsx`).
