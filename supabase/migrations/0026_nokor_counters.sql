-- Nokor denormalized engagement counters.
--
-- The feed and profile currently compute like/comment/follower counts by
-- pulling every like, comment, and follow row and counting client-side — cost
-- that grows with total content. These columns hold the counts directly, kept
-- exact by triggers. Every mutation runs in a SECURITY DEFINER trigger so
-- row-level security on the source table never blocks a bump.
--
-- Fully additive: existing `select *` reads simply gain columns the current
-- client ignores; wiring the client to read them is a later change.

-- Counter columns ------------------------------------------------------------

alter table public.nokor_posts
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

alter table public.nokor_comments
  add column if not exists like_count integer not null default 0;

create table if not exists public.nokor_user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  post_count integer not null default 0,
  follower_count integer not null default 0,
  following_count integer not null default 0
);

alter table public.nokor_user_stats enable row level security;

create policy "nokor user stats readable when signed in"
  on public.nokor_user_stats for select
  using (auth.uid() is not null);
-- No insert/update/delete policies: only the SECURITY DEFINER triggers write.

-- Trigger functions ----------------------------------------------------------

create or replace function public.nokor_bump_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.nokor_posts set like_count = like_count + 1 where id = new.post_id;
  else
    update public.nokor_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create or replace function public.nokor_bump_comment_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.nokor_comments set like_count = like_count + 1 where id = new.comment_id;
  else
    update public.nokor_comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
  end if;
  return null;
end;
$$;

create or replace function public.nokor_bump_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.nokor_posts set comment_count = comment_count + 1 where id = new.post_id;
  else
    update public.nokor_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create or replace function public.nokor_bump_post_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.nokor_user_stats (user_id, post_count)
      values (new.user_id, 1)
      on conflict (user_id) do update set post_count = nokor_user_stats.post_count + 1;
  else
    update public.nokor_user_stats set post_count = greatest(post_count - 1, 0)
      where user_id = old.user_id;
  end if;
  return null;
end;
$$;

create or replace function public.nokor_bump_follow_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.nokor_user_stats (user_id, following_count)
      values (new.follower_id, 1)
      on conflict (user_id) do update set following_count = nokor_user_stats.following_count + 1;
    insert into public.nokor_user_stats (user_id, follower_count)
      values (new.following_id, 1)
      on conflict (user_id) do update set follower_count = nokor_user_stats.follower_count + 1;
  else
    update public.nokor_user_stats set following_count = greatest(following_count - 1, 0)
      where user_id = old.follower_id;
    update public.nokor_user_stats set follower_count = greatest(follower_count - 1, 0)
      where user_id = old.following_id;
  end if;
  return null;
end;
$$;

-- Triggers -------------------------------------------------------------------

drop trigger if exists nokor_bump_post_like_trg on public.nokor_likes;
create trigger nokor_bump_post_like_trg
  after insert or delete on public.nokor_likes
  for each row execute function public.nokor_bump_post_like();

drop trigger if exists nokor_bump_comment_like_trg on public.nokor_comment_likes;
create trigger nokor_bump_comment_like_trg
  after insert or delete on public.nokor_comment_likes
  for each row execute function public.nokor_bump_comment_like();

drop trigger if exists nokor_bump_post_comment_trg on public.nokor_comments;
create trigger nokor_bump_post_comment_trg
  after insert or delete on public.nokor_comments
  for each row execute function public.nokor_bump_post_comment();

drop trigger if exists nokor_bump_post_count_trg on public.nokor_posts;
create trigger nokor_bump_post_count_trg
  after insert or delete on public.nokor_posts
  for each row execute function public.nokor_bump_post_count();

drop trigger if exists nokor_bump_follow_stats_trg on public.nokor_follows;
create trigger nokor_bump_follow_stats_trg
  after insert or delete on public.nokor_follows
  for each row execute function public.nokor_bump_follow_stats();

-- Backfill (same transaction as the triggers, so counts start correct) --------

update public.nokor_posts p
  set like_count = coalesce(x.c, 0)
  from (select post_id, count(*) c from public.nokor_likes group by post_id) x
  where x.post_id = p.id;

update public.nokor_posts p
  set comment_count = coalesce(x.c, 0)
  from (select post_id, count(*) c from public.nokor_comments group by post_id) x
  where x.post_id = p.id;

update public.nokor_comments c
  set like_count = coalesce(x.c, 0)
  from (select comment_id, count(*) c from public.nokor_comment_likes group by comment_id) x
  where x.comment_id = c.id;

insert into public.nokor_user_stats (user_id, post_count, follower_count, following_count)
select u.user_id,
       coalesce(pc.c, 0),
       coalesce(fc.c, 0),
       coalesce(gc.c, 0)
from (
  select user_id from public.nokor_posts
  union
  select following_id from public.nokor_follows
  union
  select follower_id from public.nokor_follows
) u
left join (select user_id, count(*) c from public.nokor_posts group by user_id) pc
  on pc.user_id = u.user_id
left join (select following_id, count(*) c from public.nokor_follows group by following_id) fc
  on fc.following_id = u.user_id
left join (select follower_id, count(*) c from public.nokor_follows group by follower_id) gc
  on gc.follower_id = u.user_id
on conflict (user_id) do update set
  post_count = excluded.post_count,
  follower_count = excluded.follower_count,
  following_count = excluded.following_count;

-- Realtime -------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.nokor_user_stats;
exception when duplicate_object then
  null;
end $$;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '26')
on conflict (key) do update set value = excluded.value;
