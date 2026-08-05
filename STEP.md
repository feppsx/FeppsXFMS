# Current step: Fix Impersonate (third time, real fix)

The previous two approaches hit a Supabase PKCE flow limitation — when the platform admin's browser generates the magic link server-side, there's no matching `code_verifier` for the browser to complete the exchange with. So the click round-trip fails silently.

Fix — bypass the URL round-trip entirely:
1. **Server** generates a magic-link `token_hash` (via `admin.auth.admin.generateLink`) and returns it.
2. **Client** calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` — this sets a fresh session cookie for the target user on our own domain in one call, no external redirect.
3. Client hard-navigates to `/` — root page routes the (now different) user to their home.

---

## Step 1 — Push

```bash
git add .
git commit -m "Fix impersonate: use verifyOtp with token_hash instead of magic-link redirect"
git push
```

Wait 2-4 min for Vercel.

---

## Step 2 — Test

1. Log in as `feppsx@gmail.com`.
2. Open any org detail page → click **Impersonate** on a team member → confirm.
3. Brief spinner, then you land inside that user's home (`/admin`, `/technician/jobs`, or `/client/tickets`).
4. Sidebar shows the impersonated user's org name (Wipro / Acme / etc.).
5. To exit: sign out → sign in again as `feppsx@gmail.com`.

If it still misbehaves, open browser dev tools **Console** tab, click Impersonate, and paste any red text here.

---

## When Step 2 works

Tell me and we can either move to the next power-tool feature or stop here.
