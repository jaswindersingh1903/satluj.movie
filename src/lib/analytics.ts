const VISITOR_KEY = "satluj:visitor";
const NAME_KEY = "satluj:displayName";
const CONTEXT_KEY = "satluj:context";
const EVENTS_KEY = "satluj:events";
const PROGRESS_KEY = "satluj:progress";
const VISITOR_COOKIE = "sat_visitor";
const CONTEXT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_EVENTS = 500;
const RESUME_MIN_SECONDS = 5;
const RESUME_TAIL_SECONDS = 15;

export type Device = "mobile" | "tablet" | "desktop";

export type UserContext = {
  visitorId: string;
  device: Device;
  os: string;
  browser: string;
  screen: { w: number; h: number; dpr: number };
  language: string;
  timezone: string;
  referrer: string;
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postal?: string;
  fetchedAt?: number;
};

export type AnalyticsEvent = {
  id: string;
  ts: number;
  visitorId: string;
  type: string;
  data?: Record<string, unknown>;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function ls(): Storage | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const target = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(target));
  return match ? decodeURIComponent(match.slice(target.length)) : null;
}

function writeCookie(name: string, value: string, maxAgeSec: number): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
}

function newId(): string {
  if (isBrowser() && "crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const DISPLAY_ADJ = [
  "Curious", "Brave", "Silent", "Golden", "Roaming", "Fearless",
  "Wandering", "Vibrant", "Loyal", "Radiant", "Nimble", "Bold",
  "Quiet", "Sharp", "Gentle", "Kindred", "Steady", "Wild",
];
const DISPLAY_NOUN = [
  "Otter", "Falcon", "Willow", "Sparrow", "Fox", "Deer",
  "Tiger", "Owl", "Bear", "Wolf", "Panda", "Cobra",
  "Yak", "Crane", "Ibex", "Heron", "Mynah", "Peacock",
];

export function getDisplayName(): string {
  const store = ls();
  const existing = store?.getItem(NAME_KEY);
  if (existing) return existing;
  const adj = DISPLAY_ADJ[Math.floor(Math.random() * DISPLAY_ADJ.length)];
  const noun = DISPLAY_NOUN[Math.floor(Math.random() * DISPLAY_NOUN.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  const name = `${adj}${noun}${num}`;
  store?.setItem(NAME_KEY, name);
  return name;
}

export function getVisitorId(): string {
  const store = ls();
  const existing = store?.getItem(VISITOR_KEY) ?? readCookie(VISITOR_COOKIE);
  if (existing) {
    if (store && !store.getItem(VISITOR_KEY)) store.setItem(VISITOR_KEY, existing);
    if (!readCookie(VISITOR_COOKIE)) writeCookie(VISITOR_COOKIE, existing, 60 * 60 * 24 * 365);
    return existing;
  }
  const id = newId();
  store?.setItem(VISITOR_KEY, id);
  writeCookie(VISITOR_COOKIE, id, 60 * 60 * 24 * 365);
  return id;
}

function detectDevice(ua: string): Device {
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

function detectOS(ua: string): string {
  if (/Windows/i.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Unknown";
}

function readCachedContext(): UserContext | null {
  const raw = ls()?.getItem(CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserContext;
  } catch {
    return null;
  }
}

function writeContext(ctx: UserContext): void {
  ls()?.setItem(CONTEXT_KEY, JSON.stringify(ctx));
}

async function fetchGeo(): Promise<Partial<UserContext>> {
  try {
    const res = await fetch("https://ipapi.co/json/", { credentials: "omit" });
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, string>;
    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country,
      region: data.region,
      city: data.city,
      postal: data.postal,
      fetchedAt: Date.now(),
    };
  } catch {
    return {};
  }
}

export async function ensureUserContext(): Promise<UserContext> {
  if (!isBrowser()) throw new Error("ensureUserContext requires browser");
  const cached = readCachedContext();
  const visitorId = getVisitorId();
  const ua = navigator.userAgent;
  const base: UserContext = {
    visitorId,
    device: detectDevice(ua),
    os: detectOS(ua),
    browser: detectBrowser(ua),
    screen: {
      w: window.screen.width,
      h: window.screen.height,
      dpr: window.devicePixelRatio || 1,
    },
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || "",
  };

  const stale = !cached?.fetchedAt || Date.now() - cached.fetchedAt > CONTEXT_TTL_MS;
  const geo = stale
    ? await fetchGeo()
    : {
        ip: cached?.ip,
        country: cached?.country,
        countryCode: cached?.countryCode,
        region: cached?.region,
        city: cached?.city,
        postal: cached?.postal,
        fetchedAt: cached?.fetchedAt,
      };

  const ctx: UserContext = { ...base, ...geo };
  writeContext(ctx);
  return ctx;
}

export function getUserContext(): UserContext | null {
  return readCachedContext();
}

export function trackEvent(type: string, data?: Record<string, unknown>): void {
  const store = ls();
  if (!store) return;
  const evt: AnalyticsEvent = {
    id: newId(),
    ts: Date.now(),
    visitorId: getVisitorId(),
    type,
    data,
  };
  try {
    const raw = store.getItem(EVENTS_KEY);
    const arr: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(evt);
    const trimmed = arr.length > MAX_EVENTS ? arr.slice(-MAX_EVENTS) : arr;
    store.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full or JSON error — drop silently
  }
}

export function getEvents(): AnalyticsEvent[] {
  const raw = ls()?.getItem(EVENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearEvents(): void {
  ls()?.removeItem(EVENTS_KEY);
}

type StoredProgress = { ct: number; ts: number };

export function saveProgress(currentTime: number, duration?: number): void {
  const store = ls();
  if (!store) return;
  if (currentTime < RESUME_MIN_SECONDS) return;
  if (duration && currentTime > duration - RESUME_TAIL_SECONDS) {
    store.removeItem(PROGRESS_KEY);
    return;
  }
  const payload: StoredProgress = { ct: currentTime, ts: Date.now() };
  try {
    store.setItem(PROGRESS_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function getSavedProgress(): number | null {
  const raw = ls()?.getItem(PROGRESS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredProgress;
    return Number.isFinite(parsed.ct) ? parsed.ct : null;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  ls()?.removeItem(PROGRESS_KEY);
}
