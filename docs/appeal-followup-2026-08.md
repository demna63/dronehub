# Follow-up Appeal — dronehubgeorgia-a7bd5 (August 2026)

## ⚠️ რატომ არ იყო პასუხი — დადასტურებული

Gmail-ის აუდიტი (2026-08-08):

| თარიღი | მოვლენა |
|---|---|
| 2026-07-02 22:01 | Google → "Appeal Received", Ticket ID `2JY7374I3LE6NCBUWOXOIYJ2AU` |
| 2026-07-02 22:14 | reply → `google-cloud-compliance-**noreply**@google.com` |
| 2026-07-02 22:22 | reply → იმავე noreply |
| 2026-07-07 18:09 | reply "I wait already 5 days" → იმავე noreply |
| — | Google-ისგან პასუხი **არ მოსულა** |

**მიზეზი appeal-ის ტექსტი არ არის.** სამივე follow-up გაიგზავნა `noreply@` მისამართზე,
რომელსაც არავინ კითხულობს — ანუ 2 ივლისის შემდეგ Google-მა ვერაფერი მიიღო.
დამატებით: მთელი thread Gmail-ის **Trash**-შია.

**გაფრთხილება:** ამ thread-ზე reply-ს აზრი არ აქვს. გამოიყენე მხოლოდ ქვემოთ მითითებული ფორმა.

---

## იდენტიფიკატორები — ყველა შევსებულია

| ველი | მნიშვნელობა | წყარო |
|---|---|---|
| Ticket Reference ID | `2JY7374I3LE6NCBUWOXOIYJ2AU` | Google "Appeal Received", 2026-07-02 |
| პირველი appeal-ის თარიღი | 2 July 2026 | იმავე thread |
| Billing / customer ID | `01D215-9151E4-A816E7` | GCP payment receipt, 2026-08-01 |
| Payments profile ID | `7002-3505-1032` | იმავე receipt |
| Project number | `699037237060` | `.env` → `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| Project ID | `dronehubgeorgia-a7bd5` | — |

> Firebase-ის `messagingSenderId` ყოველთვის ტოლია GCP project number-ის — ამიტომ Console-ში შესვლა არ დასჭირდა.

## როგორ გავაგზავნო

1. **Reinstatement form** (ერთადერთი რეალური არხი):
   https://support.google.com/cloud/contact/cloud_platform_reinstatement
   ველში სადაც case/ticket ითხოვს — `2JY7374I3LE6NCBUWOXOIYJ2AU`
2. თუ 5 სამუშაო დღეში პასუხი არ იქნება — GCP **Standard Support** (~$29/თვე) და ticket.
   ეს ერთადერთი გზაა ცოცხალ ადამიანთან. გააუქმე restore-ის შემდეგ.

---

## Email ტექსტი

**Subject:** Follow-up appeal (no response since 2 July 2026) — Project dronehubgeorgia-a7bd5 / Ticket 2JY7374I3LE6NCBUWOXOIYJ2AU

```
Hello Google Cloud Trust & Safety,

I am following up on an appeal acknowledged on 2 July 2026 (Ticket Reference ID
2JY7374I3LE6NCBUWOXOIYJ2AU) regarding the suspension of my project. The acknowledgement
stated I would receive a response within two business days. Five weeks have passed with no
response. I am resubmitting with every element required by the project suspension
guidelines, in case the original submission was incomplete.

PROJECT DETAILS
  Project ID:          dronehubgeorgia-a7bd5
  Project number:      699037237060
  Billing account ID:  01D215-9151E4-A816E7
  Payments profile:    7002-3505-1032
  Account email:       dimitrikutchava@gmail.com
  Ticket reference:    2JY7374I3LE6NCBUWOXOIYJ2AU
  Service affected:    https://dronehub.ge (DroneHub Georgia — a non-commercial community
                       site for drone and FPV operators in Georgia)

1. WHAT CAUSED THE ISSUE

A Google Gemini API key was inadvertently published in our production frontend JavaScript
bundle served from Firebase Hosting, between approximately 23 June and 2 July 2026.

The root cause was a build-tool behaviour, not a deliberate configuration. A diagnostic React
component read environment variables using a dynamic lookup, `import.meta.env[key]`. Vite
cannot statically analyse dynamic lookups, so instead of replacing individual variables it
inlined the entire `import.meta.env` object into the public bundle — including
VITE_GEMINI_API_KEY, which was only ever intended for local development. We were not aware
that the dynamic form caused whole-object inlining.

A third party harvested the key from the public bundle and used it for activity we did not
authorise and did not benefit from.

2. WAS THE BEHAVIOUR INTENTIONAL

No. The exposure was accidental and the resulting abuse was carried out by an unauthorised
third party, not by us. We have never intentionally exposed credentials, never resold or
shared API access, and never operated any service designed to circumvent Google's quotas,
billing, or Terms of Service. DroneHub Georgia is a free, non-commercial community project.

3. WAS THE PROJECT COMPROMISED

Yes — to the extent that a leaked API key was used by an external party. To be precise about
scope: only the Gemini API key was exposed. No service account key, no OAuth client secret,
and no IAM credential was ever present in the bundle. We have found no evidence of
unauthorised IAM changes or unauthorised project-level access. The abuse was confined to API
calls made with the harvested key.

4. STEPS TAKEN TO RESOLVE THE ISSUE

  a. Removed the dynamic `import.meta.env[key]` access pattern and deleted the diagnostic
     component that triggered the leak (commit ed35666, 2 July 2026).
  b. Hardened src/lib/firebase/config.ts to use only static `import.meta.env.VITE_*` reads,
     with an inline comment documenting why dynamic lookups are forbidden.
  c. Deleted every Gemini API key created before 2 July 2026 via Google AI Studio.
  d. Moved the remaining development-only key out of any environment file that the production
     build can read (`.env.development.local`, which Vite loads only in development mode), so
     it is structurally impossible for it to reach a production bundle.
  e. All production Gemini calls now go through a Firebase Functions proxy (`geminiProxy`)
     using Functions secrets. The client never holds an AI key.
  f. Added an automated post-build scanner (scripts/audit-dist-secrets.mjs) wired into
     `npm run build`. It scans every emitted JavaScript file for API keys, service account
     private keys, and direct keyed calls to generativelanguage.googleapis.com, and fails
     the build — blocking deploy — if any are found.
  g. Documented the incident and a set of mandatory contributor rules in the repository so
     the pattern cannot be reintroduced by us or by any future contributor.

5. CURRENT STATE AND REQUEST

The current build contains no Gemini API key. Deployment is now impossible unless the secret
scanner passes. The keys that were abused no longer exist.

We respectfully request reinstatement of project dronehubgeorgia-a7bd5. The project hosts a
volunteer-run community platform, and it has been offline for over a month, which has taken
down the site for our users.

We also request that all existing Firestore data (community posts, comments, user profiles),
Cloud Storage objects (images, STL files), and Firebase Authentication accounts be preserved
during the review. We are prepared to complete a full data export immediately upon
restoration.

If any further information or evidence would help close this case, please tell me exactly
what is needed and I will provide it the same day.

Thank you for your time.

Dimitri Kutchava
Founder, DroneHub Georgia
dimitrikutchava@gmail.com
```

---

## შენიშვნები

- **ნუ გაგზავნი ახალ appeal-ს ყოველ კვირას.** დუბლიკატები რიგს აგრძელებს. ერთი გაძლიერებული
  follow-up + 5 სამუშაო დღე ლოდინი + შემდეგ paid support.
- **ნუ შექმნი ახალ პროექტს იმავე ანგარიშით** იმავე კოდის დასაჰოსტად სანამ case ღიაა —
  ეს ხშირად evasion-ად ითვლება და ანგარიშის დონეზე იწვევს suspension-ს.
- **მონაცემები უსაფრთხოა.** suspended პროექტი 9 თვის შემდეგ ინიშნება წასაშლელად, პლუს
  30 დღე recovery. deadline ≈ 2027 აპრილი, არა ახლა.
