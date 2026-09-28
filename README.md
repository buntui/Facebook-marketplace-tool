# Facebook Marketplace Deal Finder

A phone-first Facebook Marketplace search and deal-ranking app built with Next.js, TypeScript, Tailwind, and GitHub Codespaces.

## Current features

- Facebook Marketplace only
- Mobile-first search screen
- Search text, max price, location, and radius
- Saved searches stored locally on the device
- Facebook-specific seller, distance, condition, and posted-time fields
- Duplicate and sold-listing filtering
- Deal scoring based on price, freshness, distance, and seller rating
- Direct links back to the original Facebook listing
- Codespaces configuration for working from an iPhone

## Live Facebook connection

Facebook Marketplace does not provide a normal public search API for this use case.

This project therefore uses a separate authenticated-session ingestion endpoint. That endpoint can return listings the signed-in user is already allowed to access, but it must not bypass Facebook login, CAPTCHA, rate limits, access controls, or anti-bot protections.

Configure:

```env
FACEBOOK_PROVIDER_ENDPOINT=
FACEBOOK_PROVIDER_TOKEN=
```

The endpoint receives:

```json
{
  "text": "couch",
  "maxPrice": 500,
  "location": "Norfolk, VA",
  "radiusMiles": 25
}
```

It may return either a raw array of listings or:

```json
{
  "listings": []
}
```

## Phone development

Open this repo in GitHub Codespaces, keep `npm run dev` running, and open forwarded port 3000.

## Architecture

```text
src/
  app/
    api/search/route.ts
    page.tsx
  lib/
    scoring.ts
    types.ts
  providers/
    facebook/
    index.ts
```
