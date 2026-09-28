(() => {
  const SOURCE = "deal-finder-safari-extension";

  function announce() {
    window.postMessage({ source: SOURCE, type: "DF_EXTENSION_READY" }, "*");
  }

  async function deliverLatest() {
    try {
      const payload = await browser.runtime.sendMessage({ type: "DF_GET_RESULTS" });
      if (!payload) return;
      window.postMessage({ source: SOURCE, type: "DF_RESULTS", payload }, "*");
    } catch {}
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (message?.source === "deal-finder-page" && message?.type === "DF_PING") {
      announce();
      void deliverLatest();
    }
  });

  announce();
  void deliverLatest();
})();
