-- Nokor post view counts (TikTok-style "N views").
--
-- One row per (post, viewer) so a given user only ever counts once, and a
-- SECURITY DEFINER trigger keeps a denormalised view_count on nokor_posts so
-- the feed/profile `select *` reads gain the number for free.

-- Counter column -------------------------------------------------------------

alter table public.nokor_posts
  add column if not exists view_count integer not null default 0;

-- Unique viewer rows ---------------------------------------------------------

create table if not exists public.nokor_post_views (
  post_id uuid not null references public.nokor_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists nokor_post_views_post_idx on public.nokor_post_views (post_id);

alter table public.nokor_post_views enable row level security;

drop policy if exists "fk views readable when signed in" on public.nokor_post_views;
create policy "fk views readable when signed in"
  on public.nokor_post_views for select
  using (auth.uid() is not null);

drop policy if exists "fk record own view" on public.nokor_post_views;
create policy "fk record own view"
  on public.nokor_post_views for insert
  with check (user_id = auth.uid());
-- No update/delete: a view, once recorded, is permanent.

-- Trigger --------------------------------------------------------------------

create or replace function public.nokor_bump_post_view()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.nokor_posts set view_count = view_count + 1 where id = new.post_id;
  return null;
end;
$$;

drop trigger if exists nokor_bump_post_view_trg on public.nokor_post_views;
create trigger nokor_bump_post_view_trg
  after insert on public.nokor_post_views
  for each row execute function public.nokor_bump_post_view();

-- Backfill (same transaction, so counts start correct) -----------------------

update public.nokor_posts p
  set view_count = coalesce(x.c, 0)
  from (select post_id, count(*) c from public.nokor_post_views group by post_id) x
  where x.post_id = p.id;

-- Realtime -------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.nokor_post_views;
exception when duplicate_object then
  null;
end $$;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '33')
on conflict (key) do update set value = excluded.value;
