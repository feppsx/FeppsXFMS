# Current step: Fix the auto-profile trigger + create platform admin

## Why

After `v3.sql`, creating any new user (via Supabase dashboard) fails with:
```
null value in column "organization_id" of relation "profiles"
violates not-null constraint
```

An old trigger from patch #2 auto-inserts a profile row on every new auth user, but doesn't know which org to attach them to. `v3_patch_1.sql` fixes this.

---

## Step 1 — Run `v3_patch_1.sql`

1. Supabase -> **SQL Editor** -> **+ New query**.
2. On your computer: `C:\Users\Shanjithraj\Desktop\FeppsXFMS\supabase\v3_patch_1.sql` -> right-click -> **Open with Notepad**.
3. **Ctrl + A**, **Ctrl + C** -> paste into Supabase -> **Run**.
4. Expect **Success. No rows returned.**

---

## Step 2 — Create the platform admin auth user

1. Supabase -> **Authentication -> Users**.
2. Click **Add user -> Create new user** (NOT "Send invitation").
3. Fill in:
   - **Email:** `feppsx@gmail.com`
   - **Password:** `FeppsX2026!` (or your own strong password)
   - **Auto Confirm User:** **ON**
4. Click **Create user**. It should succeed now.
5. Click the new user row in the list -> copy the **User UID**.

---

## Step 3 — Add them to `platform_admins`

Supabase -> **SQL Editor** -> **+ New query**:

```sql
insert into platform_admins (id, email, full_name)
values ('PASTE_UID_HERE', 'feppsx@gmail.com', 'FeppsXFMS Platform Admin');
```

Replace `PASTE_UID_HERE` with the UID from Step 2. Run. Expect **Success. No rows returned.**

---

## Step 4 — Verify

Still in SQL Editor:

```sql
select id, email, full_name, is_active from platform_admins;
-- expect 1 row for feppsx@gmail.com

select count(*) from profiles where organization_id is null;
-- expect 0

select role, count(*) from profiles group by role;
-- expect org_admin, and whatever technician/manager/requester counts you had
```

---

## Step 5 — Verify your existing login still works

1. In terminal: `npm run dev` (if not already running).
2. Open http://localhost:3000 -> log in as `shanjith160702@gmail.com`.
3. You should land on `/admin` exactly like before.

The `feppsx@gmail.com` account can log in too, but nothing changes for it yet — the platform admin panel (`/platform/*`) is Phase 3.

---

## When everything above is green

Tell me. I'll start Phase 2 (wiring the app to use `organization_id` in middleware + server actions).
