# Current step: Fix — "unexpected response" on Impersonate

Root cause: server actions in Next.js can't `redirect()` to an **external** URL, and Supabase's magic-link is on `*.supabase.co`. Fix — the action now returns the URL and the client does `window.location.href = url`.

---

## Step 1 — Confirm Supabase auth URLs are set

The magic link only works if Supabase is allowed to redirect back to your app.

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL:** set to your Vercel URL, e.g. `https://feppsxfms.vercel.app`.
3. **Redirect URLs:** add these two (one per line):
   ```
   https://feppsxfms.vercel.app/**
   http://localhost:3000/**
   ```
4. Click **Save**.

If you skip this, the magic-link click will land on a Supabase error page instead of your app.

---

## Step 2 — Push the code fix

```bash
git add .
git commit -m "Fix: return magic-link URL from impersonateUser instead of server redirect"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 3 — Retry impersonate

1. Log in as `feppsx@gmail.com`.
2. Open any org's detail page.
3. Click **Impersonate** on a team member → confirm.
4. You'll be sent to Supabase's magic-link URL for a split second, then land inside that user's app at `/admin` (or `/technician/jobs`) as them.
5. Sign out to return to `/login`, sign back in as yourself.

---

## When Step 3 works

Tell me and pick the next feature from the list at the bottom of the previous STEP.md.
