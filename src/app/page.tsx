"use client";

import { FormEvent, useState } from "react";

type Result = {
  provider: string;
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl?: string;
  location?: string;
  dealScore: number;
  reasons: string[];
};

type SearchResponse = {
  listings?: Result[];
  statuses?: { name: string; available: boolean; reason?: string }[];
  errors?: string[];
  error?: string;
};

export default function Home() {
  const [text, setText] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setData(null);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text,
        ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
        ...(location ? { location } : {})
      })
    });

    setData(await res.json());
    setLoading(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 sm:p-8">
      <div className="mb-7">
        <p className="text-sm font-medium text-zinc-400">MARKETPLACE FINDER</p>
        <h1 className="mt-2 text-3xl font-bold">Find real deals fast.</h1>
        <p className="mt-2 text-zinc-400">
          Search connected providers, enforce your max budget, and rank the best listings.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <input
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
          placeholder="What are you looking for?"
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
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button
          className="rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {data?.statuses && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {data.statuses.map((s) => (
            <span key={s.name} title={s.reason} className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
              {s.name}: {s.available ? "ready" : "not configured"}
            </span>
          ))}
        </div>
      )}

      {data?.error && <p className="mt-5 text-red-400">{data.error}</p>}

      <section className="mt-6 grid gap-4">
        {(data?.listings ?? []).map((item) => (
          <a
            key={`${item.provider}-${item.url}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
          >
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-xs text-zinc-500">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : "No image"}
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 font-semibold">{item.title}</h2>
                <span className="shrink-0 rounded-lg bg-zinc-800 px-2 py-1 text-sm font-bold">{item.dealScore}</span>
              </div>
              <p className="mt-1 text-lg font-bold">
                {item.price === null ? "Price unavailable" : `$${item.price.toLocaleString()}`}
              </p>
              <p className="text-sm text-zinc-400">{item.provider}{item.location ? ` • ${item.location}` : ""}</p>
              {item.reasons.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500">{item.reasons.join(" • ")}</p>
              )}
            </div>
          </a>
        ))}

        {data && !data.error && (data.listings?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-zinc-800 p-5 text-zinc-400">
            No live results yet. Configure at least one provider in <code>.env.local</code>.
          </div>
        )}
      </section>
    </main>
  );
}
