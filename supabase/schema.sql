-- Daily Ledger cloud snapshot. Run this in Supabase Dashboard > SQL Editor.
-- Every row is owned by one signed-in user; no anonymous access is granted.
create table if not exists public.ledger_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

alter table public.ledger_snapshots enable row level security;
revoke all on table public.ledger_snapshots from anon, authenticated;
grant select, insert, update on table public.ledger_snapshots to authenticated;

drop policy if exists "Ledger owner can read own snapshot" on public.ledger_snapshots;
create policy "Ledger owner can read own snapshot"
  on public.ledger_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Ledger owner can create own snapshot" on public.ledger_snapshots;
create policy "Ledger owner can create own snapshot"
  on public.ledger_snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Ledger owner can update own snapshot" on public.ledger_snapshots;
create policy "Ledger owner can update own snapshot"
  on public.ledger_snapshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
