# dronehub.ge — მიგრაცია ახალ Firebase პროექტზე (2026-08)

## კონტექსტი
ძველი პროექტი `dronehubgeorgia-a7bd5` suspended-ია (2026-07, Gemini key leak public bundle-ში).
appeal პასუხგაუცემელია. გადაწყვეტილება: **ახალ Firebase პროექტზე მიგრაცია**, ცარიელი ბაზით.
Root cause უკვე გასწორებულია კოდში (prod → `geminiProxy` Function + `defineSecret`, `audit-dist-secrets.mjs` guard), ამიტომ ახალი პროექტი უსაფრთხოა.

> **მონაცემები:** suspended პროექტიდან Firestore/Storage/Auth export **შეუძლებელია**. appeal ღიად რჩება — თუ ძველი პროექტი დაბრუნდა, მაშინ export → import ახალში. სხვა გზა არ არსებობს.

---

## 0. Gemini key rotate (პირველ რიგში)
გაჟონილი key შესაძლოა ისევ ცოცხალია.
1. Google AI Studio / GCP Console → APIs & Services → Credentials → ძველი Gemini API key **Delete/Revoke**.
2. ახალი key შექმენი. bundle-ში **არასდროს** — მხოლოდ Functions secret-ში (ნაბიჯი 4).

## პროექტის ფაქტები (2026-08-17)
- **Project ID:** `dronehub-ge-1a1a6`
- **Firestore/Storage region:** `eur3` (Europe) — Firestore (default) შექმნილია
- **Functions region:** `europe-west1` (გადატანილი us-central1-იდან)
- **Web app config:** ჩაწერილია `.env`-ში

## 1. Console setup — დასრულებული ✓
- [x] პროექტი `dronehub-ge-1a1a6` შექმნილი (GA account: dronehubgeorgia)
- [x] Web app რეგისტრირებული, config `.env`-ში
- [x] Authentication: **Email/Password** ✓, **Google** ✓, **Anonymous** ✓
- [x] Firestore (default) **eur3**, production mode
- [x] **Blaze plan** აქტიური (billing "My Billing Account", USD, budget დაყენებული)
- [x] **Storage** bucket `dronehub-ge-1a1a6.firebasestorage.app`, **EU** (Multi-Regional), production mode
- [x] tsc type-check გავლილი (sandbox build-ს linux native binary აკლდა — Mac-ზე OK)

## 2. რეპოს გადაბმა — შესრულებული ✓
- `.firebaserc` → `default: dronehub-ge-1a1a6` ✓
- `firebase.json` → `hosting.site: dronehub-ge-1a1a6` ✓
- `.env` → ყველა `VITE_FIREBASE_*` + `VITE_FIREBASE_FUNCTIONS_REGION=europe-west1` ✓
- `functions/index.js` → `region: 'europe-west1'` ✓
- `.env.development.local` → dev Gemini key (ლოკალური, არ commit-დება) — უცვლელი

## 3. CLI login + target (მომხმარებელი, ლოკალურ ტერმინალში)
```bash
firebase login
firebase use dronehub-ge-1a1a6
```

## 4. Functions secret
```bash
firebase functions:secrets:set GEMINI_API_KEY --project dronehub-ge-1a1a6
# ჩასვი ახალი key (ნაბიჯი 0)
```

## 5. Rules + Functions + Hosting deploy
```bash
npm install
npm run build                 # tsc + vite + audit-dist-secrets.mjs (secret guard)
firebase deploy --only firestore:rules,storage:rules,functions --project dronehub-ge-1a1a6
npm run deploy:hosting        # scripts/deploy-hosting.mjs
```
`dronehub-ge-1a1a6.web.app`-ზე შეამოწმე რომ საიტი მუშაობს + geminiProxy პასუხობს.

## 6. დომენის გადამისამართება `dronehub.ge`
1. Firebase Console → **Hosting → Add custom domain** → `dronehub.ge` (+ `www`).
   ⚠️ ახალი პროექტი მოითხოვს **ახალ TXT verification** ჩანაწერს (ძველისგან განსხვავებულს).
2. Cloudflare DNS:
   - `dronehub.ge` და `www` → **A `199.36.158.100`** (Proxy OFF / DNS only).
   - დაამატე Firebase-ის **ახალი TXT** verification ჩანაწერი.
   - დანარჩენ TXT-ებს (SPF/DKIM/სხვ.) **არ შეეხო**.
3. Console-ში verify → SSL provisioning (რამდენიმე წუთი–საათი).

## 7. Cleanup (verification-ის შემდეგ)
- Cloudflare Pages project `dronehub-holding` → წაშალე
- `~/Desktop/--main/holding-page/` → წაშალე
- appeal thread **დატოვე ღიად** (მონაცემების აღდგენის შანსისთვის)

## Rollback
თუ ახალ პროექტზე რამე ჩაფლავდა verification-ამდე: Cloudflare A ჩანაწერი დააბრუნე holding page-ზე (Pages CNAME) — dronehub.ge holding-ს დაუბრუნდება, ცოცხალი მდგომარეობა არ იკარგება.

## შემდეგი ნაბიჯი ახლა
⏳ ველოდები ახალი Firebase config-ს (ნაბიჯი 1.6), რომ ნაბიჯი 2 გავაკეთო.
