-- Admin moderation: block or remove visitors.
--
-- A static site can never hold the service-role key, so auth accounts are not
-- deleted; instead blocked_users is the ban list and RLS enforces it — a
-- blocked user can still authenticate but every write path denies them, and
-- the client bounces them out with a notice the moment the row appears.
-- "removed" additionally wipes the user's content.

create table if not exists public.blocked_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null default 'blocked' check (reason in ('blocked', 'removed')),
  created_at timestamptz not null default now()
);

alter table public.blocked_users enable row level security;

-- The affected user may read their own row (that's how the client learns which
-- notice to show, and how realtime delivers the kick).
drop policy if exists "read own block" on public.blocked_users;
create policy "read own block"
  on public.blocked_users for select
  using (user_id = auth.uid() or public.is_admin());

-- Writes only through the RPCs below.

create or replace function public.is_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.blocked_users b where b.user_id = auth.uid());
$$;

do $$
begin
  alter publication supabase_realtime add table public.blocked_users;
exception when duplicate_object then
  null;
end $$;

-- Admin RPCs -----------------------------------------------------------------

create or replace function public.admin_block_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if exists (select 1 from public.admins a where a.user_id = p_user_id) then
    raise exception 'cannot block an admin';
  end if;

  insert into public.blocked_users (user_id, reason)
  values (p_user_id, 'blocked')
  on conflict (user_id) do update set reason = 'blocked';
end;
$$;

create or replace function public.admin_unblock_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  delete from public.blocked_users where user_id = p_user_id;
end;
$$;

-- Block + wipe: conversations (messages cascade), community posts, membership,
-- reactions, profile. Storage files are best-effort deleted by the client.
create or replace function public.admin_remove_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if exists (select 1 from public.admins a where a.user_id = p_user_id) then
    raise exception 'cannot remove an admin';
  end if;

  insert into public.blocked_users (user_id, reason)
  values (p_user_id, 'removed')
  on conflict (user_id) do update set reason = 'removed';

  delete from public.conversations where visitor_id = p_user_id;
  delete from public.community_messages where user_id = p_user_id;
  delete from public.community_members where user_id = p_user_id;
  delete from public.community_reads where user_id = p_user_id;
  delete from public.message_reactions where user_id = p_user_id;
  delete from public.community_reactions where user_id = p_user_id;
  delete from public.profiles where user_id = p_user_id;
end;
$$;

revoke all on function public.admin_block_user(uuid) from public;
revoke all on function public.admin_unblock_user(uuid) from public;
revoke all on function public.admin_remove_user(uuid) from public;
grant execute on function public.admin_block_user(uuid) to authenticated;
grant execute on function public.admin_unblock_user(uuid) to authenticated;
grant execute on function public.admin_remove_user(uuid) to authenticated;

-- Enforcement: every write path denies blocked users -------------------------

drop policy if exists "visitor writes own messages" on public.messages;
create policy "visitor writes own messages"
  on public.messages for insert
  with check (
    sender = 'visitor'
    and edited_at is null
    and deleted_at is null
    and not public.is_blocked()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.visitor_id = auth.uid()
    )
  );

drop policy if exists "join as self" on public.community_members;
create policy "join as self"
  on public.community_members for insert
  with check (user_id = auth.uid() and not public.is_blocked());

drop policy if exists "community write as self" on public.community_messages;
create policy "community write as self"
  on public.community_messages for insert
  with check (
    user_id = auth.uid()
    and edited_at is null
    and deleted_at is null
    and is_system = false
    and not public.is_blocked()
    and (public.is_community_member() or public.is_admin())
  );

drop policy if exists "react as self" on public.message_reactions;
create policy "react as self"
  on public.message_reactions for insert
  with check (
    user_id = auth.uid()
    and not public.is_blocked()
    and public.can_see_message(message_id)
  );

drop policy if exists "community react as self" on public.community_reactions;
create policy "community react as self"
  on public.community_reactions for insert
  with check (
    user_id = auth.uid()
    and not public.is_blocked()
    and (public.is_community_member() or public.is_admin())
  );

drop policy if exists "chat attachments writable by participants" on storage.objects;
create policy "chat attachments writable by participants"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and not public.is_blocked()
    and public.owns_attachment_path(name)
    and public.is_allowed_attachment(name)
  );

-- Blocked users can't open or claim conversations either.
create or replace function public.start_conversation(
  p_name text,
  p_email text,
  p_lang text default 'en'
)
returns table (out_conversation_id uuid, out_access_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.conversations%rowtype;
  v_lang text := case when p_lang in ('en', 'km') then p_lang else 'en' end;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if public.is_blocked() then
    raise exception 'BLOCKED';
  end if;

  select * into v_existing
    from public.conversations
   where visitor_id = v_uid
   order by last_message_at desc
   limit 1;

  if found then
    update public.conversations
       set visitor_name = trim(p_name),
           visitor_email = lower(trim(p_email)),
           lang = v_lang
     where id = v_existing.id;
    return query select v_existing.id, v_existing.access_token;
    return;
  end if;

  if (select count(*) from public.conversations where visitor_id = v_uid) >= 3 then
    raise exception 'too many conversations';
  end if;

  return query
    insert into public.conversations (visitor_id, visitor_name, visitor_email, lang)
    values (v_uid, trim(p_name), lower(trim(p_email)), v_lang)
    returning conversations.id, conversations.access_token;
end;
$$;

create or replace function public.claim_conversation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if public.is_blocked() then
    raise exception 'BLOCKED';
  end if;

  update public.conversations
     set visitor_id = v_uid
   where access_token = p_token
  returning id into v_id;

  if v_id is null then
    raise exception 'invalid token';
  end if;

  return v_id;
end;
$$;
