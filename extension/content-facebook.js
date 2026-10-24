(() => {
  const DASHBOARD = "https://buntui.github.io/Facebook-marketplace-tool/";
  const MAX_CARDS = 100;
  const DELAY = 1100;
  let running = false;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const onMarketplace = () => /^\/marketplace(?:\/|$)/.test(location.pathname);
  function blocked() {
    const path = location.pathname.toLowerCase();
    if (/\/(checkpoint|login|recover)/.test(path)) return `blocked:url:${path.split("/")[1]}`;
    const text = document.body ? document.body.innerText : "";
    return /security check|required security code|captcha|confirm your identity/i.test(text) ? "blocked:text:security" : null;
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

      listings.push({
        id: match[1],
        provider: "Facebook Marketplace",
        title,
        price: DealAnalyze.parsePriceText(text).price,
        oldPrice: DealAnalyze.parsePriceText(text).oldPrice,
        location: locationFromLines(lines)
      });
    }

    return listings.slice(0, MAX_CARDS);
  }

  async function run() {
    if (running) return;
    running = true;

    const stopAtStart = blocked();
    if (stopAtStart) { if (button) button.textContent = "Stopped: Facebook security page"; return; }
    const started = Date.now();
    const rounds = [];
    let lastCount = scrape().length;
    let stableRounds = 0;

    let reason = "round_limit";
    for (let i = 0; i < 14; i += 1) {
      const security = blocked();
      if (security) { reason = security; break; }
      window.scrollBy({ top: Math.max(window.innerHeight * 1.8, 1400), behavior: "smooth" });
      await sleep(DELAY);

      const count = scrape().length;
      rounds.push(count);
      if (count === lastCount) stableRounds += 1;
      else stableRounds = 0;
      lastCount = count;

      if (count >= MAX_CARDS) { reason = "cap"; break; }
      if (stableRounds >= 2) { reason = "no_growth"; break; }
    }

    const listings = scrape();
    const handoff = DealAnalyze.encodeHandoff(listings, { maxChars: 30000 });
    const diag = { runId: String(started), host: location.host, userAgent: navigator.userAgent, layout: innerWidth < 700 ? "mobile" : "desktop", records: listings, uniqueCount: listings.length, rounds, stopReason: reason, durationMs: Date.now() - started, retries: 0, handoff: { method: "fragment", receivedCount: handoff.sent, expectedCount: handoff.sent, checksumOk: true, capped: handoff.capped, chars: handoff.chars, reason: handoff.reason } };
    const target = new URL(DASHBOARD);
    target.hash = handoff.fragment + "&diag=" + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(diag)))));
    location.assign(target.toString());
  }

  let button;
  function install() {
    if (!onMarketplace() || document.getElementById("df-import-button")) return;
    button = document.createElement("button");
    button.id = "df-import-button";
    button.textContent = "Import visible Marketplace results";
    Object.assign(button.style, { position: "fixed", zIndex: "2147483647", right: "14px", bottom: "16px", padding: "12px 14px", border: "0", borderRadius: "999px", background: "#2563eb", color: "#fff", font: "600 14px -apple-system,BlinkMacSystemFont,sans-serif", boxShadow: "0 4px 16px #0008" });
    button.addEventListener("click", () => { button.disabled = true; button.textContent = "Importing…"; void run(); });
    document.documentElement.append(button);
  }
  new MutationObserver(install).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(install, 1200); install();
})();
