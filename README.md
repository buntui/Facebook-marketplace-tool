# Deal Finder — zero-cost, local Marketplace importer

This build has no API keys, backend, paid MSRP research, or hidden background bridge. Marketplace is the only importer. The dashboard labels prices only as **vs. local asking prices**—not as MSRP, sold price, or guaranteed value.

## How it works

1. The static dashboard opens a Facebook Marketplace search in Orion.
2. You tap the visible **Import visible Marketplace results** button on Facebook.
3. The extension gathers up to 100 rendered cards using a fixed delay, then sends a compact batch in the dashboard URL fragment.
4. The dashboard validates the card count/checksum, removes the fragment, and stores only complete batches in Orion's own local storage.

No login, CAPTCHA, checkpoint, recovery, proxy, random timing, or anti-detection path is automated. A security page stops the importer and records it in diagnostics.

## First-time setup on iPhone/iPad

1. In the GitHub repo, go to **Settings → Pages → Build and deployment → Source**, then select **GitHub Actions**. This is required once for the free dashboard URL.
2. Wait for the **Deploy local Deal Finder dashboard** Action to finish. Open `https://buntui.github.io/Facebook-marketplace-tool/` in **Orion**, not Safari.
3. Download the repository ZIP in Files, unzip it, and install the `extension` folder through Orion's Extensions screen. Orion WebExtension support is experimental; this is the device-compatibility test.
4. Sign into Facebook normally in Orion.
5. Open the dashboard in Orion, search, tap the blue Import button on Marketplace, and wait for the return to the dashboard.

## Diagnostics and limits

- Qualification requires 50 unique cards on two of the latest three runs, **with no block in that window**.
- A handoff that hits the URL-size cap is displayed as incomplete and is not saved or scored.
- A median appears only with at least three other local comps.
- History is limited to 30 days and about 2,000 saved cards.
- If Orion fails to inject the blue Import button, use the copied diagnostics report before changing the extension.

## Repository layout

```text
docs/                 Static GitHub Pages dashboard
extension/            Orion WebExtension: collector + local analysis
.github/workflows/    Free GitHub Pages deployment
```
