"use client";

import { useEffect } from "react";
import { ensureUserContext, trackEvent } from "@/lib/analytics";

export function AnalyticsInit() {
  useEffect(() => {
    let cancelled = false;
    ensureUserContext()
      .then((ctx) => {
        if (cancelled) return;
        trackEvent("page_view", {
          path: window.location.pathname,
          referrer: ctx.referrer,
          country: ctx.countryCode,
          device: ctx.device,
        });
      })
      .catch(() => {
        if (cancelled) return;
        trackEvent("page_view", { path: window.location.pathname });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
