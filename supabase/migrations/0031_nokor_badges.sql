-- Verified / creator badges, admin-granted.
--
-- A per-profile badge shown beside the display name. It can only be set through
-- an admin RPC: a guard trigger on profiles resets any client-supplied badge
-- (via the normal whole-row profile upsert) unless the RPC's transaction-local
-- flag is present, so a user cannot verify themselves.

alter table public.profiles
  add column if not exists badge text
    check (badge is null or badge in ('verified', 'creator'));

-- Guard: only the admin RPC (which sets nokor.allow_badge) may change badge.
create or replace function public.nokor_guard_badge()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('nokor.allow_badge', true), '') = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.badge := null;
  else
    new.badge := old.badge;
  end if;
  return new;
end;
$$;

drop trigger if exists nokor_guard_badge_trg on public.profiles;
create trigger nokor_guard_badge_trg
  before insert or update on public.profiles
  for each row execute function public.nokor_guard_badge();

-- Admin setter. p_badge null clears it.
create or replace function public.admin_set_badge(p_user uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if p_badge is not null and p_badge not in ('verified', 'creator') then
    raise exception 'invalid badge';
  end if;
  perform set_config('nokor.allow_badge', '1', true);
  update public.profiles set badge = p_badge where user_id = p_user;
end;
$$;

revoke all on function public.admin_set_badge(uuid, text) from public;
grant execute on function public.admin_set_badge(uuid, text) to authenticated;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '31')
on conflict (key) do update set value = excluded.value;
