# Current step: Fix Impersonate (properly this time)

Two problems in the previous attempt:
1. `redirectTo` pointed at `/` instead of `/auth/callback`. Without going through the callback, Supabase's magic link doesn't set a session cookie on our domain — so you land on `/` with no session and get bounced to `/login`.
2. The manual `supabase.auth.signOut()` on the server was redundant and disruptive — the callback already replaces the cookie with the impersonated user's session.

Fixed. Now the flow is: click Impersonate → server returns Supabase magic link URL → browser navigates to it → Supabase verifies → redirects to `/auth/callback?code=xxx` → callback exchanges the code → app now has the target user's session cookie → landed at `/` which routes to their home.

**No SQL changes.** Code only.

---

## Step 1 — Push

```bash
git add .
git commit -m "Fix impersonate: point magic link at /auth/callback and stop pre-signout"
git push
```

Wait 2-4 min for Vercel.

---

## Step 2 — Test

1. Log in as `feppsx@gmail.com`.
2. Open any org detail page → click **Impersonate** on a team member → confirm.
3. Browser will briefly show Supabase's URL, then land inside that user's admin/technician/client view.
4. Check the sidebar — top-left should show the impersonated user's org (Wipro / Acme / 360 Integrated depending on who you impersonated).
5. To exit: sign out. You'll land on `/login`. Sign back in as `feppsx@gmail.com`.

---

## When Step 2 works

Tell me and we can either move on to the next feature from the deferred list, or you can just leave it here.
