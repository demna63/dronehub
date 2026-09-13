# CLAUDE.md — dronehub.ge (community site)

## რა არის ეს პროექტი
**dronehub.ge** — DroneHub Georgia-ს ქართული FPV/დრონების community საიტი.
ფუნქციები: რუკა, პოსტები, ხელსაწყოები, marketplace, chat, wiki.
Hosting: **Firebase** (`dronehubgeorgia-a7bd5` → `dronehub.ge`).

## სტეკი
- React 18 + TypeScript + Vite 5
- Tailwind CSS 3, Framer Motion
- Firebase: Auth, Firestore, Storage, Hosting, Functions (Node 20)
- Leaflet + react-leaflet (რუკა)
- React Router v6, custom i18n (ka/en)

## Build / Dev / Deploy
```bash
npm install
npm run dev          # port 4173
npm run build
npm run deploy:hosting
firebase deploy --only firestore:rules,storage:rules,functions  # rules/functions
```

## არქიტექტურა
- `src/components/` — UI
- `src/routes/AppRoutes.tsx` — routing
- `src/components/ToolsHub.tsx` — nested `/tools/*` tools
- `src/config/ecosystemLinks.ts` — cross-site nav (main, PID, VTX)
- `src/lib/firebase/` — Firebase init
- `functions/index.js` — geminiProxy (production AI)
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
`npm run lint` allows **25** warnings — the count at the time of the 2026-09 quality
pass, all `@typescript-eslint/no-explicit-any` plus two `react-refresh/only-export-components`
on the context files. The number is a ratchet: it must only ever go DOWN. Any new
warning fails the build. `npm run lint:strict` is the zero-warning target.

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
- **No `alert()` / `window.confirm()`.** Use `useToast()` and the inline two-step
  confirm pattern (see `CommentBody.tsx`).
