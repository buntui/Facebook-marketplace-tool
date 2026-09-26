# Facebook Marketplace Tool

Phone-friendly marketplace aggregator built for GitHub Codespaces.

## What this version does

- Next.js + TypeScript + Tailwind
- Mobile-first search UI
- Hard max-price filtering
- Provider abstraction (`MarketplaceProvider`)
- Real eBay Browse API provider
- Facebook Marketplace provider adapter for a compliant endpoint you control
- No fake production listings
- Provider health/status reporting
- Normalized listing format
- Deduplication
- Freshness-aware deal scoring
- Codespaces devcontainer

## Facebook status

Facebook Marketplace does not provide a normal public Marketplace search API for this use case. This repo intentionally does **not** bypass Facebook login, CAPTCHA, rate limits, anti-bot systems, or private-account controls.

`FacebookMarketplaceProvider` becomes active only when `FACEBOOK_PROVIDER_ENDPOINT` is configured to a lawful/compliant data source you control.

## Open on your phone with Codespaces

1. Open this repo on GitHub.
2. Tap **Code → Codespaces → Create codespace on main**.
3. Codespaces installs dependencies automatically.
4. Create `.env.local` from `.env.example`.
5. Run:

```bash
npm run dev
```

6. Open the forwarded port `3000`.

## Environment variables

```env
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
FACEBOOK_PROVIDER_ENDPOINT=
FACEBOOK_PROVIDER_TOKEN=
```

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
    index.ts
    ebay/
    facebook/
```
