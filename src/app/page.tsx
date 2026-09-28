"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Result = {
  id: string;
  title: string;
  price: number | null;
  url: string;
  imageUrl?: string;
  location?: string;
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
  needsLogin?: boolean;
  error?: string;
};

const SEARCHES_KEY = "fb-deal-finder-searches";
const CONTEXT_KEY = "fb-deal-finder-context";

export default function Home() {
  const [text, setText] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("25");
  const [contextId, setContextId] = useState("");
  const [loginSessionId, setLoginSessionId] = useState("");
  const [loginViewUrl, setLoginViewUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  useEffect(() => {
    try {
      setContextId(localStorage.getItem(CONTEXT_KEY) ?? "");
      const raw = localStorage.getItem(SEARCHES_KEY);
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

  async function connectFacebook() {
    setConnecting(true);
    setData(null);

    const res = await fetch("/api/facebook/connect/start", { method: "POST" });
    const json = await res.json();

    if (!res.ok) {
      setData({ error: json.error ?? "Could not start Facebook login" });
      setConnecting(false);
      return;
    }

    localStorage.setItem(CONTEXT_KEY, json.contextId);
    setContextId(json.contextId);
    setLoginSessionId(json.sessionId);
    setLoginViewUrl(json.liveViewUrl);
    setConnecting(false);
    window.location.assign(json.liveViewUrl);
  }

  async function finishLogin() {
    if (!loginSessionId) return;

    await fetch("/api/facebook/connect/finish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: loginSessionId })
    });

    setLoginSessionId("");
    setLoginViewUrl("");
  }

  async function search(e?: FormEvent) {
    e?.preventDefault();
    if (!query.text || !contextId) return;

    setLoading(true);
    setData(null);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contextId, ...query })
    });

    const json = await res.json();
    setData(json);
    setLoading(false);
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
          Search Marketplace automatically and rank listings by their discount from MSRP.
        </p>
      </header>

      {!contextId && (
        <section className="mb-5 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4">
          <h2 className="font-semibold">Connect Facebook once</h2>
          <p className="mt-1 text-sm text-zinc-400">
            A private cloud browser opens. Log into Facebook yourself; your password is never entered into Deal Finder.
          </p>
          <button
            onClick={connectFacebook}
            disabled={connecting}
            className="mt-3 w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {connecting ? "Starting browser…" : "Connect Facebook"}
          </button>
        </section>
      )}

      {contextId && !loginSessionId && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
          <span className="text-emerald-400">● Facebook connection saved</span>
          <button onClick={connectFacebook} className="text-xs text-zinc-400">Reconnect</button>
        </div>
      )}

      {loginSessionId && (
        <section className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <h2 className="font-semibold">Finish Facebook login</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Log in in the cloud-browser tab. When Facebook is fully open, come back here and tap Done.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={loginViewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-center font-semibold"
            >
              Open login
            </a>
            <button onClick={finishLogin} className="rounded-xl bg-white px-4 py-3 font-semibold text-black">
              Done logging in
            </button>
          </div>
        </section>
      )}

      <form onSubmit={search} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
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
          placeholder="Location (reference)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            disabled={loading || !contextId}
            className="rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Searching + checking MSRP…" : "Find Best Deal"}
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
          Marketplace location is primarily controlled by the location saved in your Facebook Marketplace account.
        </p>
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

      {data?.needsLogin && (
        <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="font-semibold">Facebook login expired.</p>
          <button onClick={connectFacebook} className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black">
            Reconnect Facebook
          </button>
        </div>
      )}

      {data?.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-3 text-red-300">{data.error}</p>}

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

      {data && !data.error && !data.needsLogin && (data.listings?.length ?? 0) === 0 && (
        <div className="mt-6 rounded-2xl border border-zinc-800 p-5 text-zinc-400">
          No Marketplace cards were found for this search. Facebook may have changed its results layout, or there may be no matching listings.
        </div>
      )}
    </main>
  );
}
