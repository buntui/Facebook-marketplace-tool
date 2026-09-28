# Facebook Marketplace Deal Finder

A phone-first PWA that automatically searches Facebook Marketplace through a Browserbase cloud browser, extracts the listings visible to your own authenticated Facebook account, looks up MSRP references on the web, and ranks the strongest discount first.

## What it does

- One-time Facebook login through Browserbase Live View
- Browserbase Context persists your Facebook session across searches
- Automated Facebook Marketplace search — no manual Facebook searching
- Extracts visible Marketplace listing cards
- Filters to your max price
- Looks up MSRP references through Browserbase Search
- Ranks primarily by percentage below MSRP
- Shows the MSRP source and confidence so you can verify exact model matches
- Saved searches
- Installable iPhone PWA
- Direct link to every Facebook listing

## Important limitations

Facebook does not provide a normal public Marketplace search API. The app automates a normal browser session belonging to you. It does not bypass login, CAPTCHA, rate limits, or access controls. If Facebook asks for verification, use the Browserbase Live View and complete it yourself.

Marketplace search cards do not always expose exact model numbers, seller details, timestamps, or distance. MSRP matching is therefore best-effort. Always verify that the MSRP source is for the exact model before purchasing.

## Required environment variable

The Browserbase project ID is already wired into the app. You only need to provide the API key at runtime:

```env
BROWSERBASE_API_KEY=
```

Optional project override:

```env
BROWSERBASE_PROJECT_ID=d1281f7d-b2e2-4210-9311-73282d457c72
```

Do not prefix either value with `NEXT_PUBLIC_`; the API key must remain server-side.

## Deploy

1. Import this GitHub repo into Vercel.
2. Vercel should detect Next.js automatically.
3. Add `BROWSERBASE_API_KEY` under Project Settings → Environment Variables. The project ID is already configured in the app.
4. Deploy or redeploy.
5. Open the production URL on your iPhone.
6. Tap **Connect Facebook**.
7. In Browserbase Live View, log into Facebook normally.
8. Return to Deal Finder and tap **Done logging in**.
9. Enter a product and tap **Find Best Deal**.
10. In Safari Share → **Add to Home Screen**.

The Browserbase Context ID is kept in the app's local storage on your device, so it does not need to be added to Vercel.

## Local/Codespaces development

```bash
npm install
npm run dev
```

Put the Browserbase credentials in `.env.local` while developing locally.

## Architecture

```text
src/
  app/
    api/
      facebook/connect/start/route.ts
      facebook/connect/finish/route.ts
      search/route.ts
    page.tsx
  lib/
    browserbase.ts
    msrp.ts
    scoring.ts
    types.ts
```
