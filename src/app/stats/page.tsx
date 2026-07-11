"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
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

type AuthState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "signed_in_non_admin"; user: User }
  | { kind: "signed_in_admin"; user: User };

export default function StatsPage() {
  const [state, setState] = useState<AuthState>({ kind: "loading" });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState({ kind: "signed_out" });
      return;
    }

    const resolve = async (session: Session | null) => {
      if (!session) {
        setState({ kind: "signed_out" });
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (error || !data) {
        setState({ kind: "signed_in_non_admin", user: session.user });
      } else {
        setState({ kind: "signed_in_admin", user: session.user });
      }
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      resolve(session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (state.kind === "loading") return <Centered>Checking session…</Centered>;
  if (state.kind === "signed_out") return <SignIn />;
  if (state.kind === "signed_in_non_admin")
    return <NotAdmin email={state.user.email ?? "unknown"} />;
  return <Dashboard user={state.user} />;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/stats`,
        // Do not auto-create users. Only emails that already exist in
        // auth.users (added via Supabase → Authentication → Users) can
        // receive a magic link. Unknown emails get "User not allowed".
        shouldCreateUser: false,
      },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4">
      <div className="w-full space-y-1">
        <h1 className="text-lg font-medium text-zinc-200">Sign in to stats</h1>
        <p className="text-xs text-zinc-500">
          Magic link. Only allowlisted admin emails see the dashboard.
        </p>
      </div>
      {sent ? (
        <p className="w-full rounded-lg bg-white/5 p-4 text-sm text-zinc-200 ring-1 ring-white/10">
          Link sent to <strong>{email}</strong>. Open your inbox on this device
          to complete sign-in.
        </p>
      ) : (
        <form onSubmit={submit} className="flex w-full flex-col gap-3">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg bg-white/5 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-white py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
          {error && (
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
          )}
        </form>
      )}
    </main>
  );
}

function NotAdmin({ email }: { email: string }) {
  const signOut = async () => {
    await getSupabase()?.auth.signOut();
  };
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-medium text-zinc-200">Not authorised</h1>
      <p className="text-sm text-zinc-400">
        You are signed in as <strong>{email}</strong>, but this account is not
        on the admin allowlist.
      </p>
      <button
        type="button"
        onClick={signOut}
        className="rounded-full bg-white/5 px-4 py-1.5 text-xs text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
      >
        Sign out
      </button>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4">
      <p className="text-sm text-zinc-400">{children}</p>
    </main>
  );
}

function Dashboard({ user }: { user: User }) {
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

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Satluj stats</h1>
          <p className="text-xs text-zinc-500">
            {loading ? "Loading…" : "Live from Supabase."} Signed in as{" "}
            <span className="text-zinc-300">{user.email}</span>.
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
            onClick={signOut}
            className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-white/10"
          >
            Sign out
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
