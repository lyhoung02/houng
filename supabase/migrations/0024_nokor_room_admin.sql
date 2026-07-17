-- Telegram-style room administration: invite links, member management, roles
-- and ownership transfer.
--
-- This also CLOSES TWO PRIVILEGE HOLES from 0023:
--   1. The member INSERT policy allowed `user_id = auth.uid()`, so any signed-in
--      user could add themselves to any room they knew the id of and read its
--      private history. Joining now only happens through an invite code (RPC).
--   2. The member UPDATE policy let any admin write any role — including
--      promoting themselves to 'owner' or demoting the real owner. Role changes
--      now go through guarded functions and direct writes are refused.

-- Invite codes ---------------------------------------------------------------

create or replace function public.nokor_gen_invite_code()
returns text
language sql
volatile
as $$
  -- 64 bits of entropy, hex encoded: unguessable enough for a share link.
  select substr(md5(random()::text || clock_timestamp()::text), 1, 16);
$$;

alter table public.nokor_rooms add column if not exists invite_code text;
update public.nokor_rooms set invite_code = public.nokor_gen_invite_code()
  where invite_code is null;
alter table public.nokor_rooms alter column invite_code set default public.nokor_gen_invite_code();
alter table public.nokor_rooms alter column invite_code set not null;
create unique index if not exists nokor_rooms_invite_code_idx
  on public.nokor_rooms (invite_code);

-- Lock down membership writes ------------------------------------------------

drop policy if exists "nokor room members added by admins" on public.nokor_room_members;
create policy "nokor room members added by admins"
  on public.nokor_room_members for insert
  with check (public.nokor_room_role(room_id) in ('owner', 'admin'));

-- Role changes and removals are RPC-only, so the guards can't be bypassed.
drop policy if exists "nokor room member roles set by admins" on public.nokor_room_members;
drop policy if exists "nokor room members removed" on public.nokor_room_members;

-- Member management ----------------------------------------------------------

create or replace function public.nokor_add_room_members(p_room uuid, p_members uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.nokor_room_role(p_room) not in ('owner', 'admin') then
    raise exception 'only admins can add members';
  end if;
  insert into public.nokor_room_members (room_id, user_id, role)
  select p_room, u, 'member' from unnest(p_members) as u
  on conflict do nothing;
end;
$$;

create or replace function public.nokor_set_room_role(p_room uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role text := public.nokor_room_role(p_room);
  target_role text;
begin
  if my_role not in ('owner', 'admin') then
    raise exception 'only admins can change roles';
  end if;
  if p_role not in ('admin', 'member') then
    raise exception 'role must be admin or member';   -- owner goes via transfer
  end if;
  select role into target_role from public.nokor_room_members
    where room_id = p_room and user_id = p_user;
  if target_role is null then
    raise exception 'not a member';
  end if;
  if target_role = 'owner' then
    raise exception 'the owner role cannot be changed here';
  end if;
  -- An admin may promote/demote members, but only the owner may touch admins.
  if my_role = 'admin' and target_role = 'admin' then
    raise exception 'only the owner can change an admin';
  end if;
  update public.nokor_room_members set role = p_role
    where room_id = p_room and user_id = p_user;
end;
$$;

create or replace function public.nokor_transfer_room_owner(p_room uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if public.nokor_room_role(p_room) <> 'owner' then
    raise exception 'only the owner can transfer ownership';
  end if;
  if p_user = me then
    return;
  end if;
  if not exists (
    select 1 from public.nokor_room_members where room_id = p_room and user_id = p_user
  ) then
    raise exception 'not a member';
  end if;
  update public.nokor_room_members set role = 'owner'
    where room_id = p_room and user_id = p_user;
  update public.nokor_room_members set role = 'admin'
    where room_id = p_room and user_id = me;
  update public.nokor_rooms set owner_id = p_user where id = p_room;
end;
$$;

/** Removes someone, or leaves yourself. The owner must transfer first. */
create or replace function public.nokor_remove_room_member(p_room uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_role text := public.nokor_room_role(p_room);
  target_role text;
begin
  select role into target_role from public.nokor_room_members
    where room_id = p_room and user_id = p_user;
  if target_role is null then
    return;
  end if;

  if p_user = me then
    if target_role = 'owner' then
      raise exception 'transfer ownership before leaving';
    end if;
    delete from public.nokor_room_members where room_id = p_room and user_id = me;
    return;
  end if;

  if my_role not in ('owner', 'admin') then
    raise exception 'only admins can remove members';
  end if;
  if target_role = 'owner' then
    raise exception 'the owner cannot be removed';
  end if;
  if my_role = 'admin' and target_role = 'admin' then
    raise exception 'only the owner can remove an admin';
  end if;
  delete from public.nokor_room_members where room_id = p_room and user_id = p_user;
end;
$$;

-- Invite link ----------------------------------------------------------------

/** Join via a share link. This is the only way in besides an admin adding you. */
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

/** Name/kind preview for a code, so the app can ask "Join X?" before joining. */
create or replace function public.nokor_room_preview(p_code text)
returns table (id uuid, name text, kind text, member_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.name, r.kind,
         (select count(*) from public.nokor_room_members m where m.room_id = r.id)
    from public.nokor_rooms r
   where r.invite_code = p_code
   limit 1;
$$;

/** Rotating the code invalidates every link already shared. */
create or replace function public.nokor_revoke_room_invite(p_room uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if public.nokor_room_role(p_room) not in ('owner', 'admin') then
    raise exception 'only admins can reset the invite link';
  end if;
  update public.nokor_rooms set invite_code = public.nokor_gen_invite_code()
    where id = p_room
    returning invite_code into code;
  return code;
end;
$$;

revoke all on function public.nokor_add_room_members(uuid, uuid[]) from public;
revoke all on function public.nokor_set_room_role(uuid, uuid, text) from public;
revoke all on function public.nokor_transfer_room_owner(uuid, uuid) from public;
revoke all on function public.nokor_remove_room_member(uuid, uuid) from public;
revoke all on function public.nokor_join_room(text) from public;
revoke all on function public.nokor_room_preview(text) from public;
revoke all on function public.nokor_revoke_room_invite(uuid) from public;

grant execute on function public.nokor_add_room_members(uuid, uuid[]) to authenticated;
grant execute on function public.nokor_set_room_role(uuid, uuid, text) to authenticated;
grant execute on function public.nokor_transfer_room_owner(uuid, uuid) to authenticated;
grant execute on function public.nokor_remove_room_member(uuid, uuid) to authenticated;
grant execute on function public.nokor_join_room(text) to authenticated;
grant execute on function public.nokor_room_preview(text) to authenticated;
grant execute on function public.nokor_revoke_room_invite(uuid) to authenticated;
