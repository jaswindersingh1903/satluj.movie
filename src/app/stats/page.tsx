"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  loadDaily,
  loadDevices,
  loadFunnel,
  loadGeo,
  loadSentiment,
  loadSharePlatforms,
  loadSources,
  type DailyRow,
  type DeviceRow,
  type Funnel,
  type GeoRow,
  type PlatformRow,
  type Sentiment,
  type SourceRow,
} from "@/lib/stats";

// SHA-256 of "<username>:<password>". Rotate by hashing new credentials:
//   node -e "console.log(require('crypto').createHash('sha256').update('user:pass').digest('hex'))"
const EXPECTED_HASH =
  "90b9f68c6e6011d69b1cacce6f6df29e3d9086e258d047804b93488f45f1a6f9";
const UNLOCK_KEY = "satluj:stats-unlocked";

async function sha256(msg: string): Promise<string> {
  const buf = new TextEncoder().encode(msg);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function StatsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "yes") setUnlocked(true);
  }, []);

  const attempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const hash = await sha256(`${username}:${password}`);
    if (hash === EXPECTED_HASH) {
      sessionStorage.setItem(UNLOCK_KEY, "yes");
      setUnlocked(true);
    } else {
      setError("Wrong username or password.");
    }
  };

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-lg font-medium text-zinc-200">Stats</h1>
        <form onSubmit={attempt} className="flex w-full flex-col gap-3">
          <label htmlFor="u" className="sr-only">
            Username
          </label>
          <input
            id="u"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="rounded-lg bg-white/5 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          />
          <label htmlFor="p" className="sr-only">
            Password
          </label>
          <input
            id="p"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded-lg bg-white/5 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          />
          <button
            type="submit"
            className="rounded-full bg-white py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Unlock
          </button>
          {error && (
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
          )}
        </form>
        <p className="text-center text-xs text-zinc-500">
          Data on this page is queryable via the public Supabase anon key.
          This gate is obscurity, not access control.
        </p>
      </main>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [geo, setGeo] = useState<GeoRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [downloads, setDownloads] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadFunnel(),
      loadSentiment(),
      loadDaily(30),
      loadGeo(),
      loadDevices(),
      loadSources(),
      loadSharePlatforms(),
      supabase
        ? supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("type", "download_click")
            .then(({ count }) => count ?? 0)
        : Promise.resolve(0),
    ])
      .then(([f, s, d, g, dv, sr, pl, dl]) => {
        if (cancelled) return;
        setFunnel(f);
        setSentiment(s);
        setDaily(d);
        setGeo(g);
        setDevices(dv);
        setSources(sr);
        setPlatforms(pl);
        setDownloads(dl);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Satluj stats</h1>
          <p className="text-xs text-zinc-500">
            {loading ? "Loading…" : "Live from Supabase."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(UNLOCK_KEY);
              location.reload();
            }}
            className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-white/10"
          >
            Lock
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Metric label="Visitors" value={funnel?.visitors ?? 0} />
        <Metric label="Played" value={funnel?.played ?? 0} />
        <Metric label="Finished" value={funnel?.finished ?? 0} />
        <Metric
          label="Play rate"
          value={funnel ? `${funnel.playRatePct}%` : "—"}
        />
        <Metric
          label="Completion"
          value={funnel ? `${funnel.completionRatePct}%` : "—"}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Metric label="Likes" value={sentiment?.likes ?? 0} tone="emerald" />
        <Metric label="Dislikes" value={sentiment?.dislikes ?? 0} tone="rose" />
        <Metric label="Comments" value={sentiment?.comments ?? 0} />
        <Metric
          label="Approval"
          value={sentiment ? `${sentiment.approvalPct}%` : "—"}
        />
        <Metric label="Downloads" value={downloads} />
      </section>

      <Panel title="Last 30 days">
        <SimpleTable
          headers={["Day", "Visitors", "Played", "Finished", "Commenters", "Sharers"]}
          rows={daily.map((r) => [
            r.day,
            r.visitors,
            r.played,
            r.finished,
            r.commenters,
            r.sharers,
          ])}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Geography">
          <SimpleTable
            headers={["Country", "City", "Visitors"]}
            rows={geo.map((r) => [r.country ?? "—", r.city ?? "—", r.visitors])}
          />
        </Panel>

        <Panel title="Traffic sources">
          <SimpleTable
            headers={["Source", "Visitors"]}
            rows={sources.map((r) => [r.source, r.visitors])}
          />
        </Panel>

        <Panel title="Device / OS / Browser">
          <SimpleTable
            headers={["Device", "OS", "Browser", "Visitors"]}
            rows={devices.map((r) => [r.device, r.os, r.browser, r.visitors])}
          />
        </Panel>

        <Panel title="Share platforms">
          <SimpleTable
            headers={["Platform", "Shares"]}
            rows={platforms.map((r) => [r.platform, r.shares])}
          />
        </Panel>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "emerald" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "rose"
        ? "text-rose-300"
        : "text-zinc-100";
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className={`text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
      <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
      {children}
    </section>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number | null)[][];
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-500">No data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-zinc-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-1.5 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-zinc-200">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              {r.map((cell, j) => (
                <td key={j} className="py-1.5 pr-3 tabular-nums">
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
