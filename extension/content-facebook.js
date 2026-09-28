(() => {
  if (!location.pathname.startsWith("/marketplace/")) return;

  const marker = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (marker.get("df") !== "1") return;

  const token = marker.get("token");
  const returnUrl = marker.get("return");
  if (!token || !returnUrl) return;

  let running = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function parsePrice(text) {
    const match = text.match(/\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)/);
    if (!match) return null;
    const value = Number(match[1].replace(/,/g, ""));
    return Number.isFinite(value) ? value : null;
  }

  function titleFromLines(lines) {
    const noise = /^(sponsored|shipping available|delivery available|new listing|sold)$/i;
    const candidates = lines.filter((line) => !/\$\s*[0-9]/.test(line) && !noise.test(line));
    return candidates[0] || lines[0] || "Untitled listing";
  }

  function locationFromLines(lines) {
    const withState = lines.filter((line) => /,\s*[A-Z]{2}\b/.test(line));
    return withState[withState.length - 1];
  }

  function scrape() {
    const anchors = [...document.querySelectorAll('a[href*="/marketplace/item/"]')];
    const seen = new Set();
    const listings = [];

    for (const a of anchors) {
      const href = a.href || "";
      const match = href.match(/\/marketplace\/item\/(\d+)/);
      if (!match || seen.has(match[1])) continue;
      seen.add(match[1]);

      const text = (a.innerText || a.textContent || "").trim();
      if (!text) continue;

      const lines = text.split("\n").map((x) => x.trim()).filter(Boolean);
      const title = titleFromLines(lines);
      if (!title || title.length < 2) continue;

      const img = a.querySelector("img");

      listings.push({
        id: match[1],
        provider: "Facebook Marketplace",
        title,
        price: parsePrice(text),
        currency: "USD",
        url: href.split("?")[0],
        imageUrl: img?.src || undefined,
        location: locationFromLines(lines),
        retrievedAt: new Date().toISOString()
      });
    }

    return listings;
  }

  async function run() {
    if (running) return;
    running = true;

    await sleep(1800);

    let lastCount = 0;
    let stableRounds = 0;

    for (let i = 0; i < 8; i += 1) {
      window.scrollBy({ top: Math.max(window.innerHeight * 1.8, 1400), behavior: "smooth" });
      await sleep(900);

      const count = document.querySelectorAll('a[href*="/marketplace/item/"]').length;
      if (count === lastCount) stableRounds += 1;
      else stableRounds = 0;
      lastCount = count;

      if (stableRounds >= 2 && count >= 12) break;
    }

    const listings = scrape().slice(0, 100);

    try {
      await browser.runtime.sendMessage({
        type: "DF_STORE_RESULTS",
        payload: {
          token,
          listings,
          searchedUrl: location.href
        }
      });

      const target = new URL(returnUrl);
      target.searchParams.set("df_import", "1");
      location.href = target.toString();
    } catch (error) {
      console.error("Deal Finder import failed", error);
    }
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector('a[href*="/marketplace/item/"]')) {
      observer.disconnect();
      void run();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.querySelector('a[href*="/marketplace/item/"]')) {
    observer.disconnect();
    void run();
  }

  setTimeout(() => {
    observer.disconnect();
    void run();
  }, 7000);
})();
