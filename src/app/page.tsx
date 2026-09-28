"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ImportedListing = {
  id: string;
  provider: "Facebook Marketplace";
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl?: string;
  location?: string;
  retrievedAt: string;
};

type Result = ImportedListing & {
  discountPct?: number;
  msrp?: {
    value: number;
    confidence: "high" | "medium" | "low";
    sourceTitle: string;
    sourceUrl: string;
  };
  dealScore: number;
  reasons: string[];
};

type SavedSearch = {
  id: string;
  text: string;
  maxPrice?: number;
  location?: string;
  radiusMiles?: number;
};

type SearchResponse = {
  listings?: Result[];
  count?: number;
  msrpChecked?: number;
  error?: string;
};

type ExtensionPayload = {
  token: string;
  listings: ImportedListing[];
  searchedUrl?: string;
};

const SEARCHES_KEY = "fb-deal-finder-searches";
const PENDING_KEY = "fb-deal-finder-pending";

export default function Home() {
  const [text, setText] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("25");
  const [extensionReady, setExtensionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  const query = useMemo(
    () => ({
      text: text.trim(),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(radiusMiles ? { radiusMiles: Number(radiusMiles) } : {})
    }),
    [text, maxPrice, location, radiusMiles]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCHES_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const message = event.data;
      if (!message || message.source !== "deal-finder-safari-extension") return;

      if (message.type === "DF_EXTENSION_READY") {
        setExtensionReady(true);
        return;
      }

      if (message.type === "DF_RESULTS") {
        void consumeExtensionResults(message.payload as ExtensionPayload);
      }
    };

    window.addEventListener("message", onMessage);
    window.postMessage({ source: "deal-finder-page", type: "DF_PING" }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function consumeExtensionResults(payload: ExtensionPayload) {
    const pendingRaw = localStorage.getItem(PENDING_KEY);
    if (!pendingRaw) return;

    const pending = JSON.parse(pendingRaw);
    if (!payload?.token || payload.token !== pending.token) return;

    setText(pending.query.text ?? "");
    setMaxPrice(pending.query.maxPrice?.toString() ?? "");
    setLocation(pending.query.location ?? "");
    setRadiusMiles(pending.query.radiusMiles?.toString() ?? "25");

    setLoading(true);
    setStatus(`Imported ${payload.listings.length} Facebook listings. Checking MSRP…`);
    setData(null);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...pending.query,
        listings: payload.listings
      })
    });

    const json = await res.json();
    setData(json);
    setLoading(false);
    setStatus(json.error ? "Ranking failed" : `Ranked ${json.count ?? 0} listings`);
    localStorage.removeItem(PENDING_KEY);
  }

  function launchFacebookSearch(e?: FormEvent) {
    e?.preventDefault();
    if (!query.text) return;

    const token = crypto.randomUUID();
    localStorage.setItem(PENDING_KEY, JSON.stringify({ token, query }));

    const params = new URLSearchParams({ query: query.text });
    if (query.maxPrice) params.set("maxPrice", String(Math.floor(query.maxPrice)));

    const hash = new URLSearchParams({
      df: "1",
      token,
      return: window.location.origin
    });

    setStatus("Opening Facebook Marketplace…");
    window.location.href = `https://www.facebook.com/marketplace/search/?${params.toString()}#${hash.toString()}`;
  }

  function saveCurrentSearch() {
    if (!query.text) return;
    const item: SavedSearch = { id: crypto.randomUUID(), ...query };
    const next = [item, ...saved].slice(0, 12);
    setSaved(next);
    localStorage.setItem(SEARCHES_KEY, JSON.stringify(next));
  }

  function loadSaved(item: SavedSearch) {
    setText(item.text);
    setMaxPrice(item.maxPrice?.toString() ?? "");
    setLocation(item.location ?? "");
    setRadiusMiles(item.radiusMiles?.toString() ?? "25");
  }

  const best = data?.listings?.[0];

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-10 sm:p-8">
      <header className="mb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-blue-400">FACEBOOK MARKETPLACE</p>
        <h1 className="mt-2 text-3xl font-bold">Deal Finder</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Search Marketplace through your local Safari login, import listings automatically, and rank them against MSRP.
        </p>
      </header>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
        <span className={extensionReady ? "text-emerald-400" : "text-amber-400"}>
          {extensionReady ? "● Safari extension connected" : "● Safari extension not detected"}
        </span>
        <span className="text-xs text-zinc-500">{status}</span>
      </div>

      <form onSubmit={launchFacebookSearch} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <input
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
          placeholder="What are you looking for? — Roomba, OLED TV..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
            placeholder="Max price"
            inputMode="decimal"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <input
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
            placeholder="Radius (mi)"
            inputMode="numeric"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(e.target.value)}
          />
        </div>
        <input
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
          placeholder="Location (Facebook still controls final area)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            disabled={loading}
            className="rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Checking MSRP…" : "Find Best Deal"}
          </button>
          <button
            type="button"
            onClick={saveCurrentSearch}
            className="rounded-xl border border-zinc-700 px-4 py-3 font-semibold"
          >
            Save
          </button>
        </div>

        {!extensionReady && (
          <p className="text-xs leading-5 text-amber-400">
            Install and enable the Deal Finder Safari extension before running a search. The app can still be developed without it.
          </p>
        )}
      </form>

      {saved.length > 0 && (
        <section className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Saved searches</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {saved.map((item) => (
              <button
                key={item.id}
                onClick={() => loadSaved(item)}
                className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-left"
              >
                <p className="font-semibold">{item.text}</p>
                <p className="text-xs text-zinc-500">
                  {item.maxPrice ? `≤ $${item.maxPrice}` : "Any price"}
                  {item.radiusMiles ? ` • ${item.radiusMiles} mi` : ""}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {data?.error && (
        <p className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-3 text-red-300">{data.error}</p>
      )}

      {best && (
        <section className="mt-6 rounded-3xl border border-blue-500/40 bg-blue-500/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Best deal</p>
          <div className="mt-3 grid grid-cols-[112px_1fr] gap-4">
            <div className="h-28 w-28 overflow-hidden rounded-2xl bg-zinc-900">
              {best.imageUrl && <img src={best.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div>
              <h2 className="font-bold">{best.title}</h2>
              <p className="mt-1 text-2xl font-black">
                {best.price === null ? "Price unavailable" : `$${best.price.toLocaleString()}`}
              </p>
              {best.msrp && (
                <p className="mt-1 text-sm">
                  MSRP reference: <strong>${best.msrp.value.toLocaleString()}</strong>
                  {best.discountPct !== undefined && (
                    <span className="ml-2 font-bold text-emerald-400">{best.discountPct}% off</span>
                  )}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-400">Deal score {best.dealScore}/100</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={best.url} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-500 px-4 py-3 text-center font-semibold">
              View listing
            </a>
            {best.msrp && (
              <a href={best.msrp.sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-zinc-700 px-4 py-3 text-center font-semibold">
                MSRP source
              </a>
            )}
          </div>
          {best.msrp && (
            <p className="mt-3 text-xs text-zinc-500">
              MSRP match confidence: {best.msrp.confidence}. Verify the exact model before buying.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 grid gap-3">
        {(data?.listings ?? []).slice(best ? 1 : 0).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="grid grid-cols-[92px_1fr] gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
          >
            <div className="h-[92px] w-[92px] overflow-hidden rounded-xl bg-zinc-900">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-semibold">{item.title}</h3>
                <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-bold">{item.dealScore}</span>
              </div>
              <p className="mt-1 font-bold">
                {item.price === null ? "Price unavailable" : `$${item.price.toLocaleString()}`}
              </p>
              {item.msrp && (
                <p className="text-xs text-zinc-400">
                  MSRP ${item.msrp.value.toLocaleString()}
                  {item.discountPct !== undefined ? ` • ${item.discountPct}% off` : ""}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">{item.location ?? "Location not shown"}</p>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
