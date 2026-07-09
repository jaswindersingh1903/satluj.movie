"use client";

import { useEffect } from "react";
import { ensureUserContext, trackEvent } from "@/lib/analytics";
import { drainEvents, upsertSession } from "@/lib/sync";

export function AnalyticsInit() {
  useEffect(() => {
    let cancelled = false;

    ensureUserContext()
      .then(async (ctx) => {
        if (cancelled) return;
        trackEvent("page_view", {
          path: window.location.pathname,
          referrer: ctx.referrer,
          country: ctx.countryCode,
          device: ctx.device,
        });
        await upsertSession();
        await drainEvents();
      })
      .catch(() => {
        if (cancelled) return;
        trackEvent("page_view", { path: window.location.pathname });
      });

    const interval = window.setInterval(() => {
      drainEvents().catch(() => {});
    }, 15000);

    const onHide = () => {
      if (document.hidden) drainEvents().catch(() => {});
    };
    const onBeforeUnload = () => {
      drainEvents().catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}
