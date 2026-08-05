# Current step: Deploy Phase 7 (platform admin power tools)

Four features shipped:
1. **Impersonate** — one-click "sign in as this user" for support.
2. **Reset password** — generate a new password for any tenant user.
3. **Add member** — add someone to any org from the platform panel (not just at creation).
4. **Global search** — search bar at the top of `/platform` finds orgs, users, tickets, invoices across every customer.

**No SQL changes.** Code only.

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "Phase 7: platform admin power tools (impersonate, reset password, add member, global search)"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 2 — Verify

Log in as `feppsx@gmail.com` (platform admin) and open any org's detail page.

**Add member** — click **Add member** (top right of the Team box) -> fill in email + name + role -> Create. Modal shows the temp password. Copy it, close, then log in as them in incognito.

**Impersonate** — click **Impersonate** on any team member row. Confirm the dialog. You'll be signed out and redirected to a one-time login link that signs you in as that user. You now see their view exactly. **To exit: sign out; log back in as feppsx@gmail.com.**

**Reset password** — click **Reset password** on any team member row. Confirm. A modal shows the new password (copy-to-clipboard). The user's old password stops working immediately.

**Global search** — type in the search bar at the top of any `/platform` page. Try:
- an org name (e.g. `wipro`) — matches organizations
- a person's name (e.g. `test`) — matches users
- a ticket number (e.g. `TKT-`) — matches tickets
- an invoice receipt (e.g. `INV-`) — matches invoices

Click any hit to jump to that org's detail page.

---

## What Phase 7 built

- **`lib/actions/platform-admin.ts`** — `impersonateUser`, `resetUserPassword`, `platformInviteMember`. All guarded by `requirePlatformAdmin`.
- **`lib/platform-search.ts`** — cross-org search fetcher using the service-role client.
- **`app/api/platform/search/route.ts`** — JSON endpoint the search bar calls.
- **`components/PlatformSearchBar.tsx`** — debounced live-search dropdown with grouped results.
- **`components/PlatformTeamActions.tsx`** — per-row Impersonate + Reset password buttons.
- **`components/PlatformInviteMemberButton.tsx`** — Add-member modal.
- **`components/PlatformShell.tsx`** — search bar wired into the platform header.
- **`app/platform/organizations/[id]/page.tsx`** — team table gained an Actions column and Add-member button.

### Impersonation notes
- Uses a Supabase magic-link generated with the service-role key, then redirects to it.
- No banner is shown while impersonating (v1 keeps it simple). You know because you'll see the tenant's UI and their name in the sidebar.
- To end impersonation, sign out — you'll land back at `/login`, sign in as yourself.

---

## Roadmap after Phase 7

Core multi-tenant + full support tooling shipped. What's left on the "nice to have" list:
- Audit log of platform_admin actions
- Per-org activity graph (sparkline)
- Inactive-orgs view
- Announcements banner
- Data export per org (GDPR)
- Feature flags per org
- Real email invites (SMTP/Resend)
- Stripe billing

Tell me which one to tackle next, or say "done for now" and I'll stop here.
