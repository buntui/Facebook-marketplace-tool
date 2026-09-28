# Facebook Marketplace Deal Finder

Deal Finder is now built around a **local Safari Web Extension**, not a cloud Facebook login.

## How the finished flow works

1. Open Deal Finder on iPhone/iPad.
2. Enter a Marketplace search and tap **Find Best Deal**.
3. Deal Finder opens Facebook Marketplace in Safari with the search already filled in.
4. The Safari extension runs inside your normal logged-in Facebook session.
5. It automatically scrolls the Marketplace results and extracts the visible listing cards.
6. It stores those listings inside the extension, returns Safari to Deal Finder, and hands the listings back to the app.
7. Deal Finder looks up MSRP references and ranks the strongest discount first.

Your Facebook password/cookies never go through Deal Finder or Browserbase.

## Repository layout

```text
extension/
  manifest.json
  background.js
  content-facebook.js
  content-app.js

scripts/
  make-ios-extension.sh

src/
  app/
    api/search/route.ts
    page.tsx
  lib/
    msrp.ts
    scoring.ts
    types.ts
```

## MSRP lookup

The app currently uses Browserbase Search only for public web/MSRP lookup. It does **not** use Browserbase for Facebook.

Runtime secret:

```env
BROWSERBASE_API_KEY=
```

If the key is absent, Marketplace importing still works; MSRP enrichment will simply be unavailable.

## Local web development

```bash
npm install
npm run dev
```

## Create the iPhone/iPad Safari extension

Apple requires iOS Safari Web Extensions to be wrapped in an iOS app project and signed.

On a Mac with Xcode:

```bash
chmod +x scripts/make-ios-extension.sh
./scripts/make-ios-extension.sh
```

That generates an Xcode project in `ios/`.

Then:

1. Open the generated project in Xcode.
2. Select your Apple Developer team.
3. Run it on the iPhone/iPad for testing, or archive/upload it to TestFlight.
4. On the iPhone/iPad go to **Settings → Apps → Safari → Extensions** and enable **Deal Finder**.
5. Allow access to Facebook and your Deal Finder site.

## Deploy Deal Finder itself

Deploy the Next.js repo to Vercel and set:

```env
BROWSERBASE_API_KEY=your_rotated_key
```

Then add the Vercel site to the iPhone/iPad Home Screen.

## Notes

Facebook can change its Marketplace HTML at any time. The scraper intentionally reads only listing cards rendered to your own authenticated browser session. It does not bypass login, CAPTCHA, rate limits, or Facebook access controls.

MSRP matching is best-effort because Marketplace sellers often omit exact model numbers. Always verify the MSRP source before buying.
