# Supabase Setup — 360 Integrated Ticketing (v2)

Follow this once per environment (dev, staging, prod). ~10 minutes.

> **If you already ran v1** (files `01_schema.sql` … `04_realtime.sql`), skip to step 2 and run `v2.sql` — it drops the old objects and rebuilds cleanly. You'll then need to re-add profile rows (step 5) because the profiles table is recreated with the new 3-role enum.

## 1. Create the Supabase project (fresh setups only)

1. Go to https://supabase.com → sign in → **New project**.
2. **Name:** `360-integrated-dev`, **Region:** `Southeast Asia (Singapore)`, generate + save a strong DB password.
3. Wait ~2 minutes for provisioning.

## 2. Run `v2.sql`

**SQL Editor → New query → paste the contents of `supabase/v2.sql` → Run.**

This one file does everything:
- Drops v1 objects (if present)
- Creates the `clients`, `profiles`, `tickets`, `ticket_status_history`, `ticket_attachments`, `ticket_comments`, `ticket_categories` tables
- Adds all row-level security policies
- Seeds 9 categories + 3 sample clients (Wipro Chennai CDC5, Wipro Bangalore SEZ, Prestige Centre Singapore)
- Enables realtime on the ticket tables

You should see **Success. No rows returned.**

## 3. Create the storage bucket for photos

**Storage → New bucket:**
- **Name:** `ticket-attachments`
- **Public bucket:** OFF (photos are served via signed URLs)

Then **Storage → Policies → ticket-attachments → New policy**, add these four:

**Policy 1 — Authenticated read**
```sql
bucket_id = 'ticket-attachments'
and exists (
  select 1 from ticket_attachments a
  where a.storage_path = storage.objects.name
)
```
Operation: `SELECT`, Role: `authenticated`

**Policy 2 — Authenticated insert**
```sql
bucket_id = 'ticket-attachments'
and (storage.foldername(name))[1] = 'tickets'
```
Operation: `INSERT`, Role: `authenticated`

**Policy 3 — Owner delete**
```sql
bucket_id = 'ticket-attachments' and owner = auth.uid()
```
Operation: `DELETE`, Role: `authenticated`

**Policy 4 — 360 admin full access**
```sql
bucket_id = 'ticket-attachments' and public.is_360_admin()
```
Operations: `SELECT, INSERT, UPDATE, DELETE`, Role: `authenticated`

## 4. Grab your API keys

**Project Settings → API:**
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ server-only

Paste into `.env.local`.

## 5. Verify

Run in SQL Editor:
```sql
select count(*) from clients;             -- expect 3
select count(*) from ticket_categories;   -- expect 9
select unnest(enum_range(null::user_role));   -- expect admin, technician, requester
```

## Done for now

Save the env vars from step 4.

---

## ⏳ Create initial users (do next)

**For each user:**

1. **Authentication → Users → Add user → Create new user**
   - Turn **Auto Confirm User** ON.
   - Copy the new user's UUID.
2. **SQL Editor → New query:**
   ```sql
   -- 360 Integrated admin
   insert into profiles (id, full_name, role)
   values ('<paste-uuid>', 'Admin Name', 'admin');

   -- Technician
   insert into profiles (id, full_name, role, phone)
   values ('<paste-uuid>', 'Tech Name', 'technician', '+65 9000 0001');

   -- Requester (raises tickets)
   insert into profiles (id, full_name, role)
   values ('<paste-uuid>', 'Requester Name', 'requester');
   ```
3. Run it — expect "Success. No rows returned."

Later we'll add an `on_auth_user_created` trigger so the profile row is created automatically on signup. For the 3–4 pilot accounts, the manual insert above is fine.
