browser.runtime.onMessage.addListener(async (message) => {
  if (!message?.type) return;
  if (message.type === "DF_STORE_RESULTS" || message.type === "DF_STORE_STATUS") {
    const key = message.type === "DF_STORE_RESULTS" ? "dfLatestResults" : "dfLatestStatus";
    await browser.storage.local.set({[key]: {...message.payload, savedAt: Date.now()}});
    return {ok:true};
  }
  if (message.type === "DF_GET_RESULTS") {
    const data = await browser.storage.local.get(["dfLatestResults","dfLatestStatus"]);
    return data.dfLatestResults ?? data.dfLatestStatus ?? null;
  }
  if (message.type === "DF_CLEAR_RESULTS") {
    await browser.storage.local.remove(["dfLatestResults","dfLatestStatus"]);
    return {ok:true};
  }
});
