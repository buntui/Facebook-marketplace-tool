"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Result = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl?: string;
  location?: string;
  distanceMiles?: number;
  postedAt?: string;
  condition?: string;
  sellerName?: string;
  sellerRating?: number;
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
  status?: { name: string; available: boolean; reason?: string };
  error?: string;
};

const STORAGE_KEY = "facebook-marketplace-saved-searches";

export default function Home() {
  const [text, setText] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("25");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  const query = useMemo(
    () => ({
      text: text.trim(),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(radiusMiles ? { radiusMiles: Number(radiusMiles) } : {})
    }),
    [text, maxPrice, location, radiusMiles]
  );

  function buildFacebookUrl() {
    const params = new URLSearchParams();
    params.set("query", query.text);
    if (query.maxPrice) params.set("maxPrice", String(query.maxPrice));
    return `https://www.facebook.com/marketplace/search/?${params.toString()}`;
  }

  function openFacebookSearch() {
    if (!query.text) return;
    window.location.href = buildFacebookUrl();
  }

  async function runConnectedSearch(e?: FormEvent) {
    e?.preventDefault();
    if (!query.text) return;

    setLoading(true);
    setData(null);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(query)
    });

    setData(await res.json());
    setLoading(false);
  }

  function saveCurrentSearch() {
    if (!query.text) return;
    const item: SavedSearch = {
      id: crypto.randomUUID(),
      ...query
    };
    const next = [item, ...saved].slice(0, 12);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function loadSaved(item: SavedSearch) {
    setText(item.text);
    setMaxPrice(item.maxPrice?.toString() ?? "");
    setLocation(item.location ?? "");
    setRadiusMiles(item.radiusMiles?.toString() ?? "25");
  }

  function removeSaved(id: string) {
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 sm:p-8">
      <header className="mb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-blue-400">FACEBOOK MARKETPLACE</p>
        <h1 className="mt-2 text-3xl font-bold">Deal Finder</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Build the search here, jump straight into Facebook Marketplace, then bring listings back for ranking.
        </p>
      </header>

      <form onSubmit={runConnectedSearch} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <input
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
          placeholder="Search Marketplace — couch, TV, Roomba..."
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
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <button
          type="button"
          onClick={openFacebookSearch}
          disabled={!query.text}
          className="rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white disabled:opacity-40"
        >
          Open Facebook Search
        </button>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            className="rounded-xl border border-zinc-700 px-4 py-3 font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Checking connection…" : "Search Connected Session"}
          </button>
          <button
            type="button"
            onClick={saveCurrentSearch}
            className="rounded-xl border border-zinc-700 px-4 py-3 font-semibold"
          >
            Save
          </button>
        </div>

        <p className="text-xs leading-5 text-zinc-500">
          The Facebook link passes your search text and max price. Facebook may keep location and radius from your Marketplace account settings.
        </p>
      </form>

      {saved.length > 0 && (
        <section className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Saved searches</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {saved.map((item) => (
              <div key={item.id} className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <button onClick={() => loadSaved(item)} className="text-left">
                  <p className="font-semibold">{item.text}</p>
                  <p className="text-xs text-zinc-500">
                    {item.maxPrice ? `≤ $${item.maxPrice}` : "Any price"}
                    {item.radiusMiles ? ` • ${item.radiusMiles} mi` : ""}
                  </p>
                </button>
                <button onClick={() => removeSaved(item.id)} className="mt-2 text-xs text-zinc-600">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {data?.status && (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
          <span className={data.status.available ? "text-emerald-400" : "text-amber-400"}>
            {data.status.available ? "Facebook session connected" : "Facebook session not connected"}
          </span>
          {data.status.reason && <p className="mt-1 text-xs text-zinc-500">{data.status.reason}</p>}
        </div>
      )}

      {data?.error && <p className="mt-5 text-red-400">{data.error}</p>}

      <section className="mt-6 grid gap-4">
        {(data?.listings ?? []).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="grid grid-cols-[108px_1fr] gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
          >
            <div className="flex h-[108px] w-[108px] items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-xs text-zinc-500">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : "No image"}
            </div>

            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 font-semibold">{item.title}</h2>
                <span className="shrink-0 rounded-lg bg-blue-500/15 px-2 py-1 text-sm font-bold text-blue-300">
                  {item.dealScore}
                </span>
              </div>

              <p className="mt-1 text-xl font-bold">
                {item.price === null ? "Price unavailable" : `$${item.price.toLocaleString()}`}
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                {[item.location, item.distanceMiles !== undefined ? `${item.distanceMiles} mi` : undefined, item.condition]
                  .filter(Boolean)
                  .join(" • ")}
              </p>

              {(item.sellerName || item.sellerRating !== undefined) && (
                <p className="mt-1 text-xs text-zinc-500">
                  {item.sellerName ?? "Seller"}
                  {item.sellerRating !== undefined ? ` • ★ ${item.sellerRating}` : ""}
                </p>
              )}

              {item.reasons.length > 0 && (
                <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{item.reasons.join(" • ")}</p>
              )}
            </div>
          </a>
        ))}

        {data && !data.error && (data.listings?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-zinc-800 p-5 text-zinc-400">
            {data.status?.available
              ? "No matching Facebook Marketplace listings came back."
              : "The app can launch Facebook searches now. Listing import/connected-session ingestion is the next piece."}
          </div>
        )}
      </section>
    </main>
  );
}
