import Browserbase from "@browserbasehq/sdk";
import { chromium, type Page } from "playwright-core";
import type { Listing, MarketplaceQuery } from "./types";

function requiredEnv(name: "BROWSERBASE_API_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

const DEFAULT_BROWSERBASE_PROJECT_ID = "d1281f7d-b2e2-4210-9311-73282d457c72";

export function getBrowserbase() {
  return new Browserbase({ apiKey: requiredEnv("BROWSERBASE_API_KEY") });
}

export function getProjectId() {
  return process.env.BROWSERBASE_PROJECT_ID || DEFAULT_BROWSERBASE_PROJECT_ID;
}

export async function startFacebookLogin() {
  const bb = getBrowserbase();
  const projectId = getProjectId();

  const context = await bb.contexts.create({ projectId });
  const session = await bb.sessions.create({
    projectId,
    browserContext: { id: context.id, persist: true },
    keepAlive: true,
    api_timeout: 600
  });

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const browserContext = browser.contexts()[0];
  const page = browserContext.pages()[0] ?? (await browserContext.newPage());

  await page.goto("https://www.facebook.com/login", {
    waitUntil: "domcontentloaded",
    timeout: 45_000
  });

  const debug = await bb.sessions.debug(session.id);

  return {
    contextId: context.id,
    sessionId: session.id,
    liveViewUrl: debug.debuggerFullscreenUrl
  };
}

export async function finishFacebookLogin(sessionId: string) {
  const bb = getBrowserbase();
  await bb.sessions.update(sessionId, {
    status: "REQUEST_RELEASE",
    projectId: getProjectId()
  });
}

function parsePrice(text: string): number | null {
  const match = text.match(/\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function titleFromLines(lines: string[]): string {
  const noise = /^(sponsored|shipping available|delivery available|new listing|sold)$/i;
  const nonPrice = lines.filter((line) => !/\$\s*[0-9]/.test(line) && !noise.test(line));
  return nonPrice[0] ?? lines[0] ?? "Untitled listing";
}

function locationFromLines(lines: string[]): string | undefined {
  const candidates = lines.filter((line) => /,\s*[A-Z]{2}\b/.test(line));
  return candidates[candidates.length - 1];
}

async function extractMarketplaceCards(page: Page): Promise<Listing[]> {
  const raw = await page.locator('a[href*="/marketplace/item/"]').evaluateAll((anchors) =>
    anchors.map((node) => {
      const a = node as HTMLAnchorElement;
      const img = a.querySelector("img") as HTMLImageElement | null;
      return {
        href: a.href,
        text: (a.innerText || a.textContent || "").trim(),
        imageUrl: img?.src
      };
    })
  );

  const seen = new Set<string>();
  const listings: Listing[] = [];

  for (const card of raw) {
    const url = card.href.split("?")[0];
    const idMatch = url.match(/\/marketplace\/item\/(\d+)/);
    if (!idMatch || seen.has(idMatch[1])) continue;
    seen.add(idMatch[1]);

    const lines = card.text
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const price = parsePrice(card.text);
    const title = titleFromLines(lines);
    if (!title || title.length < 2) continue;

    listings.push({
      id: idMatch[1],
      provider: "Facebook Marketplace",
      title,
      price,
      currency: "USD",
      url,
      imageUrl: card.imageUrl,
      location: locationFromLines(lines),
      retrievedAt: new Date().toISOString()
    });
  }

  return listings;
}

export async function searchFacebookMarketplace(
  contextId: string,
  query: MarketplaceQuery
): Promise<{ listings: Listing[]; needsLogin: boolean }> {
  const bb = getBrowserbase();
  const projectId = getProjectId();

  const session = await bb.sessions.create({
    projectId,
    browserContext: { id: contextId, persist: true },
    api_timeout: 120
  });

  try {
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const browserContext = browser.contexts()[0];
    const page = browserContext.pages()[0] ?? (await browserContext.newPage());

    const params = new URLSearchParams({ query: query.text });
    if (query.maxPrice) params.set("maxPrice", String(Math.floor(query.maxPrice)));

    await page.goto(`https://www.facebook.com/marketplace/search/?${params.toString()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000
    });

    await page.waitForTimeout(2500);

    const needsLogin =
      page.url().includes("/login") ||
      (await page.locator('input[name="email"]').count()) > 0 ||
      (await page.locator('input[name="pass"]').count()) > 0;

    if (needsLogin) return { listings: [], needsLogin: true };

    for (let i = 0; i < 4; i += 1) {
      await page.mouse.wheel(0, 2200);
      await page.waitForTimeout(800);
    }

    const listings = await extractMarketplaceCards(page);
    return { listings, needsLogin: false };
  } finally {
    await bb.sessions.update(session.id, {
      status: "REQUEST_RELEASE",
      projectId
    }).catch(() => undefined);
  }
}
