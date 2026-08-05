# Current step: Deploy Phase 6 (suspended-org gate)

When you suspend an org from `/platform/organizations/[id]`, its users are now automatically signed out on their next page load and shown a clear message on the login screen. Same treatment for individually deactivated users.

**No SQL changes.** Code only.

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "Phase 6: suspended-org login gate + deactivated-user gate"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 2 — Verify

1. Log in as `feppsx@gmail.com` (platform admin) -> open your **Wipro** test org detail page.
2. Click **Suspend**. Confirm the badge flips to Suspended.
3. Open an incognito window -> log in as the Wipro org_admin. As soon as you land on `/admin` (or any admin page), you'll be bounced back to `/login` with:
   > "Your organization is currently suspended. Please contact FeppsXFMS support."
4. Try logging in again — you'll be bounced immediately.
5. Back in the platform window, click **Reactivate** on the Wipro org. The Wipro admin can now log in normally.
6. On the **Team** page in a live org, click **Deactivate** on any member. In incognito, that member can no longer log in — they see:
   > "Your account has been deactivated. Contact your organization admin."

---

## What Phase 6 built

- **`lib/guard.ts`** — `requireProfile` now checks two extra things after the role check:
  1. Is the caller's org suspended or inactive? -> sign out + `/login?org_suspended=1`.
  2. Is the individual profile `is_active = false`? -> sign out + `/login?deactivated=1`.
- **`app/page.tsx`** — same two checks at the root redirect, catching users who land on `/` before hitting any protected page.
- **`app/login/page.tsx`** — new messages for `org_suspended=1` and `deactivated=1` query params.

Platform admins bypass all of this (they're in `platform_admins`, not `profiles`).

---

## Roadmap after Phase 6

The core multi-tenant platform is done:
- Phase 1 ✅ Multi-tenant schema
- Phase 2 ✅ Session + query scoping
- Phase 3 ✅ Platform admin panel
- Phase 4 ✅ Team invitations
- Phase 5 ✅ Rebrand + per-org branding
- Phase 6 ✅ Suspended-org gate

**What we deliberately deferred** (still worth doing when you have paying customers):
- **Real email invites** — replace the "temp password reveal" with a Supabase Auth invite email (needs SMTP configured in Supabase, or Resend/similar for prettier emails).
- **Stripe billing** — plans, seat limits, invoice-past-due auto-suspend.
- **Audit log** — record every platform_admin action (create org, suspend, delete) for compliance.
- **Public-flow org scoping** — the anonymous `/report` and `/track` pages currently work across all orgs; they need per-org URLs so an anonymous submission attaches to the right org.

Tell me which of those you want to tackle next, or say "done for now" and I'll leave the roadmap here.
