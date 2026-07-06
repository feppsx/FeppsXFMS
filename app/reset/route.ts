import { NextResponse } from "next/server";

// Visit https://<yoursite>/reset in the affected browser to force it to
// wipe all cached state — service workers, HTTP cache, cookies, IndexedDB.
// Then you can navigate to /login and the app runs with the LATEST bundle.

export const dynamic = "force-dynamic";

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Resetting…</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; color: #0f172a; }
  h1 { color: #0f4c81; }
  .ok { color: #059669; font-weight: 600; }
  a.btn { display: inline-block; margin-top: 16px; background: #0f4c81; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
  <h1>Cache cleared</h1>
  <p class="ok">All service workers and caches have been wiped from this browser.</p>
  <p>You can now log back in with the latest version.</p>
  <a href="/login" class="btn">Go to login</a>
  <script>
    // Belt-and-braces: also unregister any SW the browser still has references to.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // The magic — browser wipes everything before rendering this response.
      "Clear-Site-Data": '"cache", "cookies", "storage"',
      "Cache-Control": "no-store",
    },
  });
}
