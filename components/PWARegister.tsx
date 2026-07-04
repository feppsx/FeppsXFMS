"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on the client. Renders nothing.
 * Silently no-ops on browsers without SW support (older Safari on iOS < 11.3, etc).
 * Skipped in dev unless you set NEXT_PUBLIC_PWA_DEV=1, because Next dev + SW is fiddly.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isProd = process.env.NODE_ENV === "production";
    const devOverride = process.env.NEXT_PUBLIC_PWA_DEV === "1";
    if (!isProd && !devOverride) return;

    // Wait for load so we don't compete with the initial paint for bandwidth.
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  return null;
}
