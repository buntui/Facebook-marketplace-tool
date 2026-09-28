browser.runtime.onMessage.addListener(async (message) => {
  if (!message || !message.type) return;

  if (message.type === "DF_STORE_RESULTS") {
    await browser.storage.local.set({
      dfLatestResults: {
        ...message.payload,
        savedAt: Date.now()
      }
    });
    return { ok: true };
  }

  if (message.type === "DF_GET_RESULTS") {
    const data = await browser.storage.local.get("dfLatestResults");
    return data.dfLatestResults ?? null;
  }

  if (message.type === "DF_CLEAR_RESULTS") {
    await browser.storage.local.remove("dfLatestResults");
    return { ok: true };
  }
});
