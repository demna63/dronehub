# DroneHub Georgia — Community Portal

**dronehub.ge** — ქართული FPV/დრონების community პორტალი.

## Features

- Community feed, posts, comments, categories
- Pilot map (Leaflet), marketplace, global chat
- FPV tools hub (battery, channels, antenna, STL catalog, zone checker, …)
- Ecosystem links to [PID Calculator](https://pid-dronehub.ge) and [VTX Generator](https://vtx-dronehub.web.app)
- Regulations wiki with AI zone check (via Firebase Functions)
- PWA + offline support

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS, Framer Motion
- Firebase (Auth, Firestore, Storage, Hosting, Functions)
- React Router v6

## Local development

```bash
npm install
cp env.example .env.local   # fill Firebase + optional dev Gemini key
npm run dev                 # http://localhost:4173
```

## Build & deploy

```bash
npm run build
npm run deploy:hosting      # build + firebase deploy --only hosting
```

Firebase project: `dronehubgeorgia-a7bd5`  
Production URL: https://dronehub.ge

## Project structure

```
src/
  components/     # UI (Feed, ToolsHub, map, chat, admin, …)
  routes/         # AppRoutes.tsx
  config/         # ecosystemLinks.ts
  constants/      # toolsData, categories
  services/       # apiService, geminiService, firestore
  lib/firebase/   # Firebase init
functions/        # geminiProxy Cloud Function
public/           # brand assets, PWA manifest, service worker
```

## Ecosystem

| App | URL |
|-----|-----|
| Main portal | https://dronehub.ge |
| PID Calculator | https://pid-dronehub.ge |
| VTX Generator | https://vtx-dronehub.web.app |

Heavy tools (PID analyzer, VTX table generator) live on dedicated sites; the main portal links to them via the ecosystem nav.
