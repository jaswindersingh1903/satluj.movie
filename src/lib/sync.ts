import { getSupabase } from "./supabase";
import {
  clearEvents,
  getDisplayName,
  getEvents,
  getUserContext,
} from "./analytics";

export async function upsertSession(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const ctx = getUserContext();
  if (!ctx) return;

  await client.from("sessions").upsert({
    id: ctx.visitorId,
    display_name: getDisplayName(),
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
    last_seen_at: new Date().toISOString(),
  });
}

export async function drainEvents(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const events = getEvents();
  if (events.length === 0) return;

  const rows = events.map((e) => ({
    session_id: e.visitorId,
    type: e.type,
    data: e.data ?? null,
    ts: new Date(e.ts).toISOString(),
  }));

  const { error } = await client.from("events").insert(rows);
  if (!error) clearEvents();
}
