# 360 Integrated — Facility Ticketing

Web app for 360 Integrated to manage facility tickets from client sites (Wipro Chennai CDC5, Wipro Bangalore, Prestige Centre, etc.). Requesters at any site raise tickets with photo + description; 360 admin triages, assigns a technician, and closes them out.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase (Auth + Postgres + Storage + Realtime) · deployed on Vercel.

---

## Roles

- **Admin** (360 Integrated staff) — manages the Clients list, sees every ticket, assigns technicians.
- **Technician** (360 Integrated field worker) — sees only jobs assigned to them; Start / Pause / Resolve.
- **Requester** — anyone who raises tickets. Picks a Client from the dropdown, fills details, uploads photos. Sees only their own tickets.

---

## Project layout

```
supabase/            v2.sql (single-file schema + RLS + seed + realtime), SETUP.md
app/                 Next.js App Router pages
  login/             Sign-in
  auth/signout/      POST route to end the session
  admin/             360 admin ticket queue + assignment
  admin/clients/     Manage the flat Clients list
  client/tickets/    Requester views (list, raise, detail)
  technician/jobs/   Technician job list + status controls
components/          Shared UI (badges, forms, timeline, realtime)
lib/
  supabase/          Browser + server + middleware Supabase clients
  actions/           Server Actions for mutations (tickets, clients)
  db-types.ts        TypeScript mirror of DB enums + row shapes
  guard.ts           Role guard helper for server components
  ticket-data.ts     Shared query to fetch full ticket detail
  utils.ts           cn(), homeForRole()
middleware.ts        Session refresh + auth redirect
```

---

## Local dev

1. **Prereqs:** Node 20+, a Supabase project set up per `supabase/SETUP.md`.
2. `npm install`
3. `cp .env.local.example .env.local` and paste your Supabase URL + anon key + service role key.
4. `npm run dev` → open http://localhost:3000

**Other scripts:** `npm run build` · `npm run start` · `npm run typecheck` · `npm run lint`

---

## Deploy to Vercel

Push to a GitHub repo → Vercel → Add New → Project → Import. Set the three env vars from `.env.local` under **Environment Variables**. Deploy.

---

## Where things are up to

**Done**
- Flat Clients model — admin adds sites like "Wipro Chennai CDC5"
- Ticket create form with Location (client dropdown) + Specific area + description + multi-photo upload
- Admin queue with Open / New / In progress / Resolved / All filters
- Admin ticket detail with Assign-technician dropdown
- Admin **Clients** page for adding new client sites
- Technician job list + Start / Pause / Resolve controls
- Requester ticket list + detail with Close / Reopen when resolved
- Live realtime — status changes appear across all open windows without refresh

**Pending**

1. **Email + push notifications** on status change (Supabase Edge Function + Resend).
2. **Comments thread** on tickets — clients + technicians can converse mid-job.
3. **Technician resolution photos** — upload before marking resolved.
4. **Edit / deactivate clients** from the admin portal.
5. **PWA manifest + service worker** for install-to-home-screen on mobile.
6. **Auto-create profile trigger** on new auth user (so signup replaces manual insert).

Once web is stable, then port to React Native (Expo) as we discussed.
