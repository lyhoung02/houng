-- Rich messages: attachments (photo/file/voice/video note), replies, edit,
-- soft delete, and emoji reactions.

-- Message columns ----------------------------------------------------------

alter table public.messages
  add column if not exists kind text not null default 'text'
    check (kind in ('text', 'image', 'file', 'audio', 'video')),
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size bigint,
  add column if not exists attachment_mime text,
  -- Voice/video note length, so the bubble can show it without probing the file.
  add column if not exists duration_ms integer,
  add column if not exists reply_to_id uuid references public.messages (id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists messages_reply_to_idx on public.messages (reply_to_id);

-- The original body check assumed every message was text. Attachment-only
-- messages carry an empty body, and deleting clears it, so both must be legal.
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check check (
  char_length(body) <= 4000
  and (
    deleted_at is not null
    or kind <> 'text'
    or char_length(trim(body)) >= 1
  )
);

-- A non-text message must actually point at a file, unless it's been deleted.
alter table public.messages drop constraint if exists messages_attachment_check;
alter table public.messages add constraint messages_attachment_check check (
  deleted_at is not null
  or kind = 'text'
  or attachment_path is not null
);

-- Visitors insert their own rows directly, so re-state the insert policy to
-- also forbid forging the moderation columns.
drop policy if exists "visitor writes own messages" on public.messages;
create policy "visitor writes own messages"
  on public.messages for insert
  with check (
    sender = 'visitor'
    and edited_at is null
    and deleted_at is null
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.visitor_id = auth.uid()
    )
  );

drop policy if exists "admin writes messages" on public.messages;
create policy "admin writes messages"
  on public.messages for insert
  with check (
    sender = 'admin'
    and edited_at is null
    and deleted_at is null
    and public.is_admin()
  );

-- Edits and deletes go through the RPCs below rather than an UPDATE policy: a
-- blanket UPDATE grant would also let a client rewrite sender, kind, or
-- attachment_path on their own rows.

-- Who am I on this message? ------------------------------------------------

-- True when the caller may read the conversation the message belongs to.
create or replace function public.can_see_message(p_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
     where m.id = p_message_id
       and (c.visitor_id = auth.uid() or public.is_admin())
  );
$$;

-- True when the caller is the author of the message.
create or replace function public.owns_message(p_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
     where m.id = p_message_id
       and (
         (m.sender = 'visitor' and c.visitor_id = auth.uid())
         or (m.sender = 'admin' and public.is_admin())
       )
  );
$$;

-- Edit / delete ------------------------------------------------------------

create or replace function public.edit_message(p_message_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.owns_message(p_message_id) then
    raise exception 'not your message';
  end if;
  if char_length(trim(p_body)) < 1 then
    raise exception 'empty body';
  end if;

  update public.messages
     set body = p_body,
         edited_at = now()
   where id = p_message_id
     and kind = 'text'      -- only text is editable
     and deleted_at is null;

  if not found then
    raise exception 'message not editable';
  end if;
end;
$$;

-- Soft delete: the row survives so both sides can render a tombstone, but the
-- content is cleared. Returns the storage path (if any) so the caller can
-- remove the file too.
create or replace function public.delete_message(p_message_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  -- The admin may delete anything in their own inbox; a visitor only their own.
  if not (public.owns_message(p_message_id) or public.is_admin()) then
    raise exception 'not allowed';
  end if;
  if not public.can_see_message(p_message_id) then
    raise exception 'not allowed';
  end if;

  select attachment_path into v_path
    from public.messages where id = p_message_id;

  update public.messages
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

-- Reactions ----------------------------------------------------------------

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists message_reactions_message_idx
  on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

create policy "read reactions on visible messages"
  on public.message_reactions for select
  using (public.can_see_message(message_id));

create policy "react as self"
  on public.message_reactions for insert
  with check (user_id = auth.uid() and public.can_see_message(message_id));

create policy "unreact as self"
  on public.message_reactions for delete
  using (user_id = auth.uid());

revoke all on function public.edit_message(uuid, text) from public;
revoke all on function public.delete_message(uuid) from public;
grant execute on function public.edit_message(uuid, text) to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;

alter publication supabase_realtime add table public.message_reactions;

-- Storage ------------------------------------------------------------------
-- Private bucket: attachments are only reachable through short-lived signed
-- URLs minted for people who pass the policies below.

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-attachments', 'chat-attachments', false, 26214400) -- 25 MB
on conflict (id) do update set public = false, file_size_limit = 26214400;

-- Objects are keyed <conversation_id>/<message_id>/<filename>, so the first
-- path segment decides who may touch them.
create or replace function public.owns_attachment_path(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_convo uuid;
begin
  begin
    v_convo := ((storage.foldername(p_name))[1])::uuid;
  exception when others then
    return false;   -- not a uuid-prefixed key
  end;

  return exists (
    select 1 from public.conversations c
     where c.id = v_convo
       and (c.visitor_id = auth.uid() or public.is_admin())
  );
end;
$$;

drop policy if exists "chat attachments readable by participants" on storage.objects;
create policy "chat attachments readable by participants"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and public.owns_attachment_path(name)
  );

drop policy if exists "chat attachments writable by participants" on storage.objects;
create policy "chat attachments writable by participants"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and public.owns_attachment_path(name)
  );

drop policy if exists "chat attachments deletable by participants" on storage.objects;
create policy "chat attachments deletable by participants"
  on storage.objects for delete
  using (
    bucket_id = 'chat-attachments'
    and public.owns_attachment_path(name)
  );
