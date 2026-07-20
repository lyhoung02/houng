-- Nokor user reports.
--
-- Gives users a way to flag abusive content so the admin has a signal (triage
-- from the Supabase dashboard until a queue UI exists). Additive: a new table
-- with its own policies, no changes to existing tables. Shaped up front for the
-- later auto-flagging filter (nullable reporter_id + a `source` column) so that
-- feature needs no breaking migration.

create table if not exists public.nokor_reports (
  id uuid primary key default gen_random_uuid(),
  -- Null for source='auto'; set null (not cascade) so a deleted reporter keeps
  -- the evidence intact.
  reporter_id uuid references auth.users (id) on delete set null,
  target_kind text not null
    check (target_kind in ('post', 'comment', 'dm_message', 'room_message', 'story', 'profile')),
  target_id uuid not null,
  target_user_id uuid references auth.users (id) on delete cascade,
  reason text not null
    check (reason in ('spam', 'harassment', 'nudity', 'violence', 'hate', 'scam', 'other')),
  note text check (note is null or char_length(note) <= 500),
  -- Snapshot of the target's body at report time, so later edits/deletes cannot
  -- destroy the evidence.
  snapshot text,
  source text not null default 'user' check (source in ('user', 'auto')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution text,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- One open report per (reporter, target); auto rows (null reporter) are exempt.
create unique index if not exists nokor_reports_unique_open
  on public.nokor_reports (reporter_id, target_kind, target_id)
  where status = 'open' and reporter_id is not null;

-- Admin-queue scan: open reports, newest first.
create index if not exists nokor_reports_open_idx
  on public.nokor_reports (created_at desc)
  where status = 'open';

alter table public.nokor_reports enable row level security;

-- A signed-in, non-blocked user files their own reports and cannot report their
-- own content. Auto (source='auto') rows are written by SECURITY DEFINER code
-- and bypass this policy.
create policy "nokor report insert own"
  on public.nokor_reports for insert
  with check (
    reporter_id = auth.uid()
    and source = 'user'
    and target_user_id is distinct from auth.uid()
    and not public.is_blocked()
  );

create policy "nokor reports readable by reporter or admin"
  on public.nokor_reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "nokor reports resolved by admin"
  on public.nokor_reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- Rate limit user reports to 20 / 24h (reuses the 0028 counter). Auto reports
-- are exempt.
create or replace function public.nokor_rate_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'user' then
    perform public.nokor_check_rate('report', 20, interval '24 hours');
  end if;
  return new;
end;
$$;

drop trigger if exists nokor_rate_reports_trg on public.nokor_reports;
create trigger nokor_rate_reports_trg
  before insert on public.nokor_reports
  for each row execute function public.nokor_rate_reports();

-- Realtime so a future admin queue can badge new reports live.
do $$
begin
  alter publication supabase_realtime add table public.nokor_reports;
exception when duplicate_object then
  null;
end $$;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '30')
on conflict (key) do update set value = excluded.value;
