-- Profiles (username / phone / avatar), a single community room, and storage
-- for avatars. Community is one-to-many: members post, everyone subscribed
-- sees it live, admin replies like any member but flagged with from_admin.

-- Profiles -------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text check (username is null or char_length(trim(username)) between 2 and 40),
  phone text check (phone is null or char_length(trim(phone)) between 5 and 30),
  avatar_path text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Readable by anyone signed in: usernames/avatars must render in community
-- chat. Emails are NOT here — nothing sensitive leaks.
create policy "profiles readable when signed in"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "insert own profile"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "update own profile"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Community ------------------------------------------------------------------

create table if not exists public.community_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table public.community_members enable row level security;

-- Membership and member-count are visible to any signed-in user (the join
-- screen shows how many people are in).
create policy "membership readable when signed in"
  on public.community_members for select
  using (auth.uid() is not null);

create policy "join as self"
  on public.community_members for insert
  with check (user_id = auth.uid());

create policy "leave as self"
  on public.community_members for delete
  using (user_id = auth.uid());

create or replace function public.is_community_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.community_members m where m.user_id = auth.uid());
$$;

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  body text not null default '',
  kind text not null default 'text'
    check (kind in ('text', 'image', 'file', 'audio', 'video')),
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  attachment_mime text,
  duration_ms integer,
  reply_to_id uuid references public.community_messages (id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  -- Stamped by trigger from public.admins; clients cannot set it.
  from_admin boolean not null default false,
  created_at timestamptz not null default now(),
  check (
    char_length(body) <= 4000
    and (deleted_at is not null or kind <> 'text' or char_length(trim(body)) >= 1)
  ),
  check (deleted_at is not null or kind = 'text' or attachment_path is not null)
);

create index if not exists community_messages_created_idx
  on public.community_messages (created_at);

alter table public.community_messages enable row level security;

create policy "community readable by members"
  on public.community_messages for select
  using (public.is_community_member() or public.is_admin());

-- from_admin must be false at insert time: the trigger below is what sets it,
-- so a client can't post pretending to be the admin.
create policy "community write as self"
  on public.community_messages for insert
  with check (
    user_id = auth.uid()
    and edited_at is null
    and deleted_at is null
    and from_admin = false
    and (public.is_community_member() or public.is_admin())
  );

create or replace function public.on_community_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.from_admin := exists (
    select 1 from public.admins a where a.user_id = new.user_id
  );
  return new;
end;
$$;

drop trigger if exists community_messages_before_insert on public.community_messages;
create trigger community_messages_before_insert
  before insert on public.community_messages
  for each row execute function public.on_community_message_insert();

-- Edit / delete via RPC, same reasoning as the 1:1 chat: a blanket UPDATE
-- policy would let authors rewrite kind/attachment_path/from_admin.

create or replace function public.edit_community_message(p_message_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(trim(p_body)) < 1 then
    raise exception 'empty body';
  end if;

  update public.community_messages
     set body = p_body,
         edited_at = now()
   where id = p_message_id
     and user_id = auth.uid()
     and kind = 'text'
     and deleted_at is null;

  if not found then
    raise exception 'message not editable';
  end if;
end;
$$;

create or replace function public.delete_community_message(p_message_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  select attachment_path into v_path
    from public.community_messages
   where id = p_message_id
     and (user_id = auth.uid() or public.is_admin());

  if not found then
    raise exception 'not allowed';
  end if;

  update public.community_messages
     set deleted_at = now(),
         body = '',
         attachment_path = null,
         attachment_name = null,
         attachment_size = null,
         attachment_mime = null,
         duration_ms = null
   where id = p_message_id
     and deleted_at is null;

  return v_path;
end;
$$;

revoke all on function public.edit_community_message(uuid, text) from public;
revoke all on function public.delete_community_message(uuid) from public;
grant execute on function public.edit_community_message(uuid, text) to authenticated;
grant execute on function public.delete_community_message(uuid) to authenticated;

alter publication supabase_realtime add table public.community_messages;

-- Community attachments share the chat-attachments bucket under the
-- "community/" prefix, so the path checker learns that prefix.
create or replace function public.owns_attachment_path(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_first text;
  v_convo uuid;
begin
  v_first := (storage.foldername(p_name))[1];

  if v_first = 'community' then
    return public.is_community_member() or public.is_admin();
  end if;

  begin
    v_convo := v_first::uuid;
  exception when others then
    return false;
  end;

  return exists (
    select 1 from public.conversations c
     where c.id = v_convo
       and (c.visitor_id = auth.uid() or public.is_admin())
  );
end;
$$;

-- Avatars --------------------------------------------------------------------
-- Public bucket: avatars render constantly in chat lists, so signed URLs would
-- be churn for no secrecy gain. Path is <user_id>/<file>, writable only by
-- that user.

insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 2097152) -- 2 MB
on conflict (id) do update set public = true, file_size_limit = 2097152;

drop policy if exists "avatars readable" on storage.objects;
create policy "avatars readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars write own" on storage.objects;
create policy "avatars write own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
