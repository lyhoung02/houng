-- Rich Nokor DMs: attachments, reactions, replies, edit/soft-delete, and read
-- receipts — the same feature set as the portfolio chat, scoped to a thread.

-- Message columns ------------------------------------------------------------

alter table public.nokor_dm_messages
  add column if not exists kind text not null default 'text'
    check (kind in ('text', 'image', 'file', 'audio', 'video')),
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size bigint,
  add column if not exists attachment_mime text,
  add column if not exists duration_ms integer,
  add column if not exists reply_to_id uuid
    references public.nokor_dm_messages (id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- An attachment-only message has no body, and a soft-deleted one has neither.
alter table public.nokor_dm_messages alter column body set default '';
alter table public.nokor_dm_messages drop constraint if exists nokor_dm_messages_body_check;
alter table public.nokor_dm_messages drop constraint if exists nokor_dm_messages_content_check;
alter table public.nokor_dm_messages
  add constraint nokor_dm_messages_content_check
  check (
    char_length(body) <= 4000
    and (
      char_length(trim(body)) > 0
      or attachment_path is not null
      or deleted_at is not null
    )
  );

-- Authors may edit their own message and soft-delete it (clearing the body).
create policy "nokor dm edit own message"
  on public.nokor_dm_messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Reactions ------------------------------------------------------------------

create or replace function public.nokor_can_see_dm_message(p_message uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.nokor_dm_messages m
    where m.id = p_message and public.nokor_in_dm_thread(m.thread_id)
  );
$$;

create table if not exists public.nokor_dm_reactions (
  message_id uuid not null references public.nokor_dm_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.nokor_dm_reactions enable row level security;

create policy "nokor dm reactions readable by participants"
  on public.nokor_dm_reactions for select
  using (public.nokor_can_see_dm_message(message_id));

create policy "nokor dm react as self"
  on public.nokor_dm_reactions for insert
  with check (user_id = auth.uid() and public.nokor_can_see_dm_message(message_id));

create policy "nokor dm unreact as self"
  on public.nokor_dm_reactions for delete
  using (user_id = auth.uid());

-- Read receipts --------------------------------------------------------------

create table if not exists public.nokor_dm_reads (
  thread_id uuid not null references public.nokor_dm_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

alter table public.nokor_dm_reads enable row level security;

create policy "nokor dm reads readable by participants"
  on public.nokor_dm_reads for select
  using (public.nokor_in_dm_thread(thread_id));

create policy "nokor dm read as self"
  on public.nokor_dm_reads for insert
  with check (user_id = auth.uid() and public.nokor_in_dm_thread(thread_id));

create policy "nokor dm read update as self"
  on public.nokor_dm_reads for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.nokor_dm_reactions;
alter publication supabase_realtime add table public.nokor_dm_reads;

-- Storage --------------------------------------------------------------------
-- DM attachments live in the existing private chat-attachments bucket, keyed
-- <thread_id>/<message_id>/<file>. Teach the path checker that a uuid prefix
-- may also be a Nokor DM thread the caller participates in.

create or replace function public.owns_attachment_path(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_first text;
  v_id uuid;
begin
  v_first := (storage.foldername(p_name))[1];

  if v_first = 'community' then
    return public.is_community_member() or public.is_admin();
  end if;

  begin
    v_id := v_first::uuid;
  exception when others then
    return false;
  end;

  -- Portfolio chat conversation…
  if exists (
    select 1 from public.conversations c
     where c.id = v_id
       and (c.visitor_id = auth.uid() or public.is_admin())
  ) then
    return true;
  end if;

  -- …or a Nokor DM thread the caller is part of.
  return public.nokor_in_dm_thread(v_id);
end;
$$;
