import { getSupabase } from "./supabase";
import {
  clearEvents,
  getDisplayName,
  getEvents,
  getUserContext,
  getVisitorId,
} from "./analytics";

function buildSessionRow(): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: getVisitorId(),
    display_name: getDisplayName(),
    last_seen_at: new Date().toISOString(),
  };
  const ctx = getUserContext();
  if (ctx) {
    Object.assign(row, {
      device: ctx.device,
      os: ctx.os,
      browser: ctx.browser,
      language: ctx.language,
      timezone: ctx.timezone,
      country: ctx.country ?? null,
      country_code: ctx.countryCode ?? null,
      region: ctx.region ?? null,
      city: ctx.city ?? null,
      ip: ctx.ip ?? null,
      screen_w: ctx.screen.w,
      screen_h: ctx.screen.h,
      dpr: ctx.screen.dpr,
      referrer: ctx.referrer,
    });
  }
  return row;
}

async function upsertRow(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("sessions").upsert(buildSessionRow());
  if (error) throw error;
}

let ensurePromise: Promise<void> | null = null;

// Guarantees a session row exists in the DB. Memoized so many callers
// (ReactionButtons, CommentBox) share the same request. Retries on
// failure by clearing the memoized promise.
export async function ensureSessionInDb(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = upsertRow().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  return ensurePromise;
}

// Re-upsert with the current (possibly richer) context. Called by
// AnalyticsInit once ensureUserContext() has resolved.
export async function upsertSession(): Promise<void> {
  await ensureSessionInDb();
  await upsertRow();
}

export async function drainEvents(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const events = getEvents();
  if (events.length === 0) return;

  await ensureSessionInDb();

  const rows = events.map((e) => ({
    session_id: e.visitorId,
    type: e.type,
    data: e.data ?? null,
    ts: new Date(e.ts).toISOString(),
  }));

  const { error } = await client.from("events").insert(rows);
  if (!error) clearEvents();
}
