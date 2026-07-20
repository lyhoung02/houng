-- Nokor write rate limiting.
--
-- Every write path is reachable with the anon key via PostgREST, so one
-- authenticated user can flood posts, comments, stories, messages, follows, or
-- DM/room joins at wire speed. A per-user fixed-window counter, enforced by
-- BEFORE INSERT triggers and inside the two join/DM RPCs, caps that. All
-- counter access is SECURITY DEFINER so the counter table needs no client
-- policies; admins are exempt.

-- Counter store --------------------------------------------------------------

create table if not exists public.nokor_rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  bucket_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, action, bucket_start)
);

create index if not exists nokor_rate_limits_bucket_idx
  on public.nokor_rate_limits (bucket_start);

alter table public.nokor_rate_limits enable row level security;
-- No policies: only the SECURITY DEFINER functions below touch this table.

-- Core check -----------------------------------------------------------------

create or replace function public.nokor_check_rate(p_action text, p_limit integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz;
  v_count integer;
begin
  -- Unauthenticated inserts are rejected by RLS anyway; admins are exempt.
  if auth.uid() is null or public.is_admin() then
    return;
  end if;
  -- Fixed window aligned to the epoch: all events in the same window share a row.
  v_bucket := to_timestamp(
    floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window)
  );
  insert into public.nokor_rate_limits (user_id, action, bucket_start, count)
    values (auth.uid(), p_action, v_bucket, 1)
    on conflict (user_id, action, bucket_start)
      do update set count = nokor_rate_limits.count + 1
    returning count into v_count;
  if v_count > p_limit then
    -- Aborts the surrounding statement; the failed attempt's increment rolls
    -- back with it, so the counter settles at the limit.
    raise exception 'rate_limited';
  end if;
end;
$$;

revoke all on function public.nokor_check_rate(text, integer, interval) from public;

-- Per-table trigger wrappers (SECURITY DEFINER so they may call the check
-- after execute is revoked from public). -----------------------------------

create or replace function public.nokor_rate_posts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.nokor_check_rate('post', 10, interval '1 hour');
  return new;
end; $$;

create or replace function public.nokor_rate_comments()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.nokor_check_rate('comment', 60, interval '1 hour');
  return new;
end; $$;

create or replace function public.nokor_rate_stories()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.nokor_check_rate('story', 10, interval '1 hour');
  return new;
end; $$;

-- DMs and room messages share one 'message' bucket (combined 30 / minute).
create or replace function public.nokor_rate_messages()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.nokor_check_rate('message', 30, interval '1 minute');
  return new;
end; $$;

create or replace function public.nokor_rate_follows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.nokor_check_rate('follow', 100, interval '1 hour');
  return new;
end; $$;

drop trigger if exists nokor_rate_posts_trg on public.nokor_posts;
create trigger nokor_rate_posts_trg
  before insert on public.nokor_posts
  for each row execute function public.nokor_rate_posts();

drop trigger if exists nokor_rate_comments_trg on public.nokor_comments;
create trigger nokor_rate_comments_trg
  before insert on public.nokor_comments
  for each row execute function public.nokor_rate_comments();

drop trigger if exists nokor_rate_stories_trg on public.nokor_stories;
create trigger nokor_rate_stories_trg
  before insert on public.nokor_stories
  for each row execute function public.nokor_rate_stories();

drop trigger if exists nokor_rate_dm_messages_trg on public.nokor_dm_messages;
create trigger nokor_rate_dm_messages_trg
  before insert on public.nokor_dm_messages
  for each row execute function public.nokor_rate_messages();

drop trigger if exists nokor_rate_room_messages_trg on public.nokor_room_messages;
create trigger nokor_rate_room_messages_trg
  before insert on public.nokor_room_messages
  for each row execute function public.nokor_rate_messages();

drop trigger if exists nokor_rate_follows_trg on public.nokor_follows;
create trigger nokor_rate_follows_trg
  before insert on public.nokor_follows
  for each row execute function public.nokor_rate_follows();

-- Rate-limit the two join/DM RPCs from inside their bodies (20 / hour each).
-- Bodies reproduced verbatim from 0017 / 0024 with one guard line added.

create or replace function public.nokor_open_dm(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  lo uuid;
  hi uuid;
  tid uuid;
begin
  if me is null or p_other is null or me = p_other then
    raise exception 'invalid dm target';
  end if;
  perform public.nokor_check_rate('open_dm', 20, interval '1 hour');
  lo := least(me, p_other);
  hi := greatest(me, p_other);
  insert into public.nokor_dm_threads (user_lo, user_hi)
    values (lo, hi)
    on conflict (user_lo, user_hi) do nothing;
  select id into tid from public.nokor_dm_threads
    where user_lo = lo and user_hi = hi;
  return tid;
end;
$$;

create or replace function public.nokor_join_room(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  rid uuid;
begin
  if me is null then
    raise exception 'not signed in';
  end if;
  perform public.nokor_check_rate('join_room', 20, interval '1 hour');
  select id into rid from public.nokor_rooms where invite_code = p_code;
  if rid is null then
    raise exception 'invalid or expired invite';
  end if;
  insert into public.nokor_room_members (room_id, user_id, role)
    values (rid, me, 'member')
  on conflict do nothing;
  return rid;
end;
$$;

-- Housekeeping ---------------------------------------------------------------

create or replace function public.nokor_purge_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.nokor_rate_limits where bucket_start < now() - interval '48 hours';
$$;

-- Schedule the purge if pg_cron is available; the migration still succeeds if
-- it is not (the function can be scheduled by hand later).
do $$
begin
  perform cron.schedule('nokor-purge-rate-limits', '17 4 * * *',
    $cron$select public.nokor_purge_rate_limits()$cron$);
exception when others then
  null;
end $$;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '28')
on conflict (key) do update set value = excluded.value;
