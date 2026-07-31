# Current step: Deploy Phase 4 (team invitations)

Org admins can now invite team members (any role: Admin, Manager, Technician, Requester) from a single **Team** page. Uses the same temp-password pattern as the Phase 3 org creation — no SMTP required. Every invite is logged in the `invitations` table.

No SQL changes this time — only code.

---

## Step 1 — Push to GitHub

```bash
git status
git add .
git commit -m "Phase 4: team invitations (unified /admin/team page)"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 2 — Try it live

1. Open Vercel URL, log in as **`shanjith160702@gmail.com`** (360 Integrated org_admin).
2. In the sidebar you'll see a new **Team** item (right below Estates). Click it.
3. You'll see all current team members with their role + status. Your own row is at the top; you can't deactivate yourself.
4. Click **Invite member** (top right). Modal opens.
5. Fill in a test invite:
   - Full name: `Test Tech`
   - Email: `testtech@example.com`
   - Role: Technician
   - Click **Create invite**.
6. Success screen shows the temp password. **Copy it**, close the modal.
7. Open incognito window -> log in with `testtech@example.com` + temp password -> lands on `/technician/jobs`.
8. Back in the admin window, refresh Team page — Test Tech should appear with Active status. Try Deactivate/Reactivate.

---

## What Phase 4 built

- **`lib/actions/invitations.ts`** — `inviteTeamMember(email, name, role)` creates auth user + profile in the caller's org, logs the invitation. `setTeamMemberActive(userId, boolean)` toggles their active flag.
- **`components/InviteTeamMemberForm.tsx`** — modal form with copy-to-clipboard temp password reveal.
- **`components/TeamPageClient.tsx`** — team roster table with status pills + activate/deactivate.
- **`components/TeamMemberActiveToggle.tsx`** — per-row toggle button.
- **`app/admin/team/page.tsx`** — server component that fetches org's profiles (RLS-scoped) and passes to the client.
- **Sidebar update** — new **Team** entry for org_admin, with Technicians/Managers indented under it.

The org_admin is protected against deactivating themselves (both server-side check and UI disable). RLS on `profiles` ensures they can only see + modify members of their own org.

Note: the older `/admin/technicians` and `/admin/managers` pages still work for role-specific management (e.g. assigning trades to technicians). Team is the unified entry point for adding people.

---

## When Step 2 is green

Tell me. Phase 5 next — rebrand chrome from "360 Integrated" to "FeppsXFMS", per-org branding on invoices/quotations, close the public `/signup` page (invite-only mode).
