import { getSupabase } from "./supabase";

export type Funnel = {
  visitors: number;
  played: number;
  finished: number;
  playRatePct: number;
  completionRatePct: number;
};

export type Sentiment = {
  likes: number;
  dislikes: number;
  comments: number;
  approvalPct: number;
};

export type DailyRow = {
  day: string;
  visitors: number;
  played: number;
  finished: number;
  commenters: number;
  sharers: number;
};

export type GeoRow = {
  country: string | null;
  city: string | null;
  visitors: number;
};

export type DeviceRow = {
  device: string;
  os: string;
  browser: string;
  visitors: number;
};

export type SourceRow = {
  source: string;
  visitors: number;
};

export type PlatformRow = {
  platform: string;
  shares: number;
};

async function count(
  table: "sessions" | "events" | "comments",
  filter?: (q: ReturnType<typeof buildQuery>) => ReturnType<typeof buildQuery>,
): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

function buildQuery() {
  return getSupabase()!.from("sessions").select();
}

async function distinctSessionCount(eventType: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("events")
    .select("session_id")
    .eq("type", eventType);
  if (!data) return 0;
  return new Set(data.map((r) => r.session_id)).size;
}

export async function loadFunnel(): Promise<Funnel> {
  const [visitors, played, finished] = await Promise.all([
    count("sessions"),
    distinctSessionCount("video_play"),
    distinctSessionCount("video_ended"),
  ]);
  return {
    visitors,
    played,
    finished,
    playRatePct: visitors ? Math.round((1000 * played) / visitors) / 10 : 0,
    completionRatePct: played ? Math.round((1000 * finished) / played) / 10 : 0,
  };
}

export async function loadSentiment(): Promise<Sentiment> {
  const supabase = getSupabase();
  if (!supabase) return { likes: 0, dislikes: 0, comments: 0, approvalPct: 0 };
  const [counterRes, commentCount] = await Promise.all([
    supabase.from("counters").select("likes,dislikes").eq("id", "reactions").maybeSingle(),
    count("comments"),
  ]);
  const likes = counterRes.data?.likes ?? 0;
  const dislikes = counterRes.data?.dislikes ?? 0;
  const total = likes + dislikes;
  return {
    likes,
    dislikes,
    comments: commentCount,
    approvalPct: total ? Math.round((1000 * likes) / total) / 10 : 0,
  };
}

export async function loadDaily(days = 30): Promise<DailyRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: sessions }, { data: events }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, created_at")
      .gte("created_at", since),
    supabase
      .from("events")
      .select("session_id, type, ts")
      .gte("ts", since)
      .in("type", ["video_play", "video_ended", "comment_post", "share_success"]),
  ]);

  const bucket = new Map<
    string,
    { visitors: Set<string>; played: Set<string>; finished: Set<string>; commenters: Set<string>; sharers: Set<string> }
  >();
  const dayOf = (iso: string) => iso.slice(0, 10);

  for (const s of sessions ?? []) {
    const d = dayOf(s.created_at as string);
    if (!bucket.has(d))
      bucket.set(d, {
        visitors: new Set(),
        played: new Set(),
        finished: new Set(),
        commenters: new Set(),
        sharers: new Set(),
      });
    bucket.get(d)!.visitors.add(s.id as string);
  }
  for (const e of events ?? []) {
    const d = dayOf(e.ts as string);
    if (!bucket.has(d))
      bucket.set(d, {
        visitors: new Set(),
        played: new Set(),
        finished: new Set(),
        commenters: new Set(),
        sharers: new Set(),
      });
    const b = bucket.get(d)!;
    const sid = e.session_id as string;
    if (e.type === "video_play") b.played.add(sid);
    if (e.type === "video_ended") b.finished.add(sid);
    if (e.type === "comment_post") b.commenters.add(sid);
    if (e.type === "share_success") b.sharers.add(sid);
  }

  return Array.from(bucket.entries())
    .map(([day, b]) => ({
      day,
      visitors: b.visitors.size,
      played: b.played.size,
      finished: b.finished.size,
      commenters: b.commenters.size,
      sharers: b.sharers.size,
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

export async function loadGeo(): Promise<GeoRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("sessions")
    .select("country, city")
    .not("country", "is", null);
  if (!data) return [];
  const bucket = new Map<string, GeoRow>();
  for (const s of data) {
    const key = `${s.country ?? ""}|${s.city ?? ""}`;
    if (!bucket.has(key)) bucket.set(key, { country: s.country, city: s.city, visitors: 0 });
    bucket.get(key)!.visitors += 1;
  }
  return Array.from(bucket.values()).sort((a, b) => b.visitors - a.visitors).slice(0, 20);
}

export async function loadDevices(): Promise<DeviceRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("sessions").select("device, os, browser");
  if (!data) return [];
  const bucket = new Map<string, DeviceRow>();
  for (const s of data) {
    const key = `${s.device ?? "?"}|${s.os ?? "?"}|${s.browser ?? "?"}`;
    if (!bucket.has(key))
      bucket.set(key, {
        device: s.device ?? "?",
        os: s.os ?? "?",
        browser: s.browser ?? "?",
        visitors: 0,
      });
    bucket.get(key)!.visitors += 1;
  }
  return Array.from(bucket.values()).sort((a, b) => b.visitors - a.visitors).slice(0, 20);
}

export async function loadSources(): Promise<SourceRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("sessions").select("referrer");
  if (!data) return [];
  const bucket = new Map<string, number>();
  for (const s of data) {
    const raw = (s.referrer as string | null) ?? "";
    let source = "(direct)";
    if (raw) {
      try {
        source = new URL(raw).hostname || "(direct)";
      } catch {
        source = raw;
      }
    }
    bucket.set(source, (bucket.get(source) ?? 0) + 1);
  }
  return Array.from(bucket.entries())
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 20);
}

export async function loadSharePlatforms(): Promise<PlatformRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select("data")
    .eq("type", "share_success");
  if (!data) return [];
  const bucket = new Map<string, number>();
  for (const row of data) {
    const platform =
      ((row.data as Record<string, unknown> | null)?.method as string | undefined) ??
      "unknown";
    bucket.set(platform, (bucket.get(platform) ?? 0) + 1);
  }
  return Array.from(bucket.entries())
    .map(([platform, shares]) => ({ platform, shares }))
    .sort((a, b) => b.shares - a.shares);
}
