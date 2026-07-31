# FeppsXFMS

Multi-tenant facility management SaaS. Each customer (organization) gets their own workspace with tickets, technicians, invoices, quotations, and service reports — walled off from every other customer by row-level security.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase (Auth + Postgres + Storage + Realtime) · Vercel.

---

## Roles

| Role | Table | Scope | What they do |
|---|---|---|---|
| `platform_admin` | `platform_admins` | Whole platform | You. Creates customer orgs, suspends/deletes, sees everything. |
| `org_admin` | `profiles` | One org | The customer's boss. Manages their team + estates + tickets. |
| `manager` | `profiles` | One org | Supervises technicians. |
| `technician` | `profiles` | One org | Executes jobs assigned to them. |
| `requester` | `profiles` | One org | Raises tickets. Sees only their own. |

---

## First-time setup (done once)

### 1. Local environment

```bash
git clone https://github.com/feppsx/FeppsXFMS.git
cd FeppsXFMS
npm install
cp .env.local.example .env.local     # then fill in the three keys below
npm run dev                          # http://localhost:3000
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Get these from Supabase → Project Settings → API.

### 2. GitHub

Repo lives at https://github.com/feppsx/FeppsXFMS.

To push new work:

```bash
git add .
git commit -m "what you changed"
git push
```

### 3. Supabase

Region: `Southeast Asia (Singapore)`. Run migrations in this order in the SQL Editor:

1. `supabase/v2.sql`
2. `supabase/patches_batch1_of_2.sql`  (patches 1–11 bundled)
3. `supabase/patches_batch2_of_2.sql`  (patches 12–25 bundled)
4. `supabase/v3.sql`                    (multi-tenant migration)

**Storage buckets** (Storage → New bucket, both Public OFF):

- `ticket-attachments`
- `company-assets`

Add 4 policies on `ticket-attachments` — see `supabase/SETUP.md`.

### 4. Vercel

Import the GitHub repo. Set the same three env vars from `.env.local` under **Settings → Environment Variables** (tick Production + Preview + Development for each). Deploy.

After first deploy, in Supabase → **Authentication → URL Configuration**, add the Vercel URL as **Site URL** and to **Redirect URLs**.

---

## Local dev commands

```bash
npm run dev         # start local dev server on port 3000
npm run build       # production build (run before deploy to catch errors)
npm run typecheck   # TypeScript check without emitting files
npm run lint        # ESLint
```

---

## Adding the first users (after v3.sql has run)

### Platform admin (you)

1. Supabase → **Authentication → Users → Add user**. Email `feppsx@gmail.com`, Auto Confirm ON. Copy the UID.
2. SQL Editor:
   ```sql
   insert into platform_admins (id, email, full_name)
   values ('<paste-uid>', 'feppsx@gmail.com', 'FeppsXFMS Platform Admin');
   ```

### Org admin for the seeded "360 Integrated" org

Already exists: `shanjith160702@gmail.com` was migrated from the old `admin` role to `org_admin`. Login works as before.

### Adding a new customer org (post-Phase-3)

Once Phase 3 ships, this happens through `/platform/organizations/new`. Until then, do it in SQL:

```sql
-- 1. Create the org
insert into organizations (name, slug, plan)
values ('Acme Corp', 'acme', 'pro')
returning id;

-- 2. Create their first org_admin (after adding the auth user in Supabase Auth)
insert into profiles (id, full_name, role, organization_id)
values ('<user-uid>', 'Acme Admin', 'org_admin', '<org-id-from-step-1>');
```

---

## File map

```
app/
  admin/            org_admin views (tickets, estates, invoices, etc.)
  technician/       technician views (jobs, calendar, reports)
  client/           requester views (raise/view own tickets)
  platform/         [Phase 3+] platform_admin views (all orgs)
  invite/[token]/   [Phase 4+] invite acceptance page
  login/            sign in
  auth/             callback + signout
  api/              server endpoints (PDFs, whoami, etc.)
  track/[token]/    public ticket status by token (anonymous)
  report/           public ticket intake (anonymous)

components/         shared UI
lib/
  supabase/         browser + server + middleware Supabase clients
  actions/          Server Actions (mutations for tickets, invoices, etc.)
  db-types.ts       TypeScript mirror of DB enums + row shapes
  guard.ts          role-guard helpers (server components)
  utils.ts          cn(), homeForRole()

supabase/
  v2.sql                        base schema (single-tenant)
  v2_patch_1.sql .. 25.sql      incremental patches
  patches_batch1_of_2.sql       patches 1-11 bundled
  patches_batch2_of_2.sql       patches 12-25 bundled
  v3.sql                        multi-tenant migration
  SETUP.md                      storage bucket policies
```

---

## Multi-tenant model (post-v3.sql)

Every tenant-owned row carries an `organization_id`. RLS enforces:

- **Signed-in user** sees only rows where `organization_id = current_org_id()` (their org, from their profile).
- **Platform admin** bypasses org filter — sees all orgs.
- **Anon (public)** sees `is_active = true` rows on `clients`, `client_tenants`, `ticket_categories` (for the public /report form dropdowns).

Helper functions in Postgres:

- `current_org_id()` — the caller's org, from their profile row.
- `auth_role()` — the caller's role.
- `is_org_admin()` / `is_org_staff()` — role checks (any org).
- `is_platform_admin()` — caller is in `platform_admins`.

---

## Roadmap

| Phase | What | Status |
|---|---|---|
| 1 | Multi-tenant schema (`v3.sql`) | in progress |
| 2 | Session + query scoping (middleware + guard helpers) | pending |
| 3 | Platform admin panel (`/platform/*`) | pending |
| 4 | Invite flow (`invitations` table + `/invite/[token]`) | pending |
| 5 | Rebrand + per-org settings + delete `/signup` | pending |
| 6 | Suspended-org gate + polish | pending |
| Later | Billing (Stripe) + plan limits + audit log | deferred |

---

## Troubleshooting

**500: MIDDLEWARE_INVOCATION_FAILED on Vercel.** Env vars missing or not ticked for Production. Fix in Vercel Settings → Environment Variables, then redeploy (untick "Use existing Build Cache").

**"Invalid credentials" on login.** User doesn't exist in this Supabase project, or password mismatch. Recreate via Authentication → Users → Add user (Auto Confirm ON).

**Duplicate key on `profiles_pkey` when inserting a profile.** A profile row already exists (auto-created). Use `UPDATE` instead of `INSERT`.

**Git push denied 403.** Windows Credential Manager has cached the wrong GitHub account. Remove `git:https://github.com` entries and push again.

**Wrong Supabase region.** Can't be changed. Delete project (Project Settings → General → Delete) and recreate.

**Wrong project when pushing.** Run `pwd && git remote -v` before every push to verify.
