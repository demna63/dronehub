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
