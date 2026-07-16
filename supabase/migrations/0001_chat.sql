-- Live chat: visitors (anonymous auth) talk to a single admin (you).
--
-- Identity model:
--   * Visitors sign in with Supabase anonymous auth -> they get a real auth.uid().
--     conversations.visitor_id holds that uid, so RLS + Realtime work normally.
--   * conversations.access_token is the secret in the "resume chat" email link.
--     Opening that link on a new device calls claim_conversation(token), which
--     re-points visitor_id at the new anonymous uid.
--   * Admins are rows in public.admins keyed by auth uid.

create extension if not exists pgcrypto;

-- Admins -------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- is_admin() is SECURITY DEFINER so policies on other tables can consult
-- admins without needing a SELECT policy on admins itself (which would
-- otherwise recurse).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

create policy "admins read own row"
  on public.admins for select
  using (user_id = auth.uid());

-- Conversations ------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references auth.users (id) on delete set null,
  visitor_name text not null check (char_length(trim(visitor_name)) between 1 and 80),
  visitor_email text not null check (visitor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unread_for_admin integer not null default 0,
  unread_for_visitor integer not null default 0
);

create index if not exists conversations_visitor_id_idx on public.conversations (visitor_id);
create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);
create unique index if not exists conversations_access_token_idx on public.conversations (access_token);

alter table public.conversations enable row level security;

-- A visitor may read their own conversation row (including its access_token,
-- which is their own resume secret — they already hold it).
create policy "visitor reads own conversation"
  on public.conversations for select
  using (visitor_id = auth.uid());

create policy "admin reads all conversations"
  on public.conversations for select
  using (public.is_admin());

create policy "admin updates conversations"
  on public.conversations for update
  using (public.is_admin())
  with check (public.is_admin());

-- No INSERT policy for visitors: conversations are only created through
-- start_conversation(), which validates and rate-limits.

-- Messages -----------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender text not null check (sender in ('visitor', 'admin')),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  emailed_at timestamptz
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "visitor reads own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.visitor_id = auth.uid()
    )
  );

create policy "visitor writes own messages"
  on public.messages for insert
  with check (
    sender = 'visitor'
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.visitor_id = auth.uid()
    )
  );

create policy "admin reads all messages"
  on public.messages for select
  using (public.is_admin());

create policy "admin writes messages"
  on public.messages for insert
  with check (sender = 'admin' and public.is_admin());

-- Keep conversation counters in sync ---------------------------------------

create or replace function public.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         unread_for_admin =
           case when new.sender = 'visitor' then unread_for_admin + 1 else 0 end,
         unread_for_visitor =
           case when new.sender = 'admin' then unread_for_visitor + 1 else 0 end
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.on_message_insert();

-- RPCs ---------------------------------------------------------------------

-- Creates (or reuses) this visitor's conversation and returns the secret
-- access_token exactly once, for the resume link.
create or replace function public.start_conversation(p_name text, p_email text)
-- OUT params are prefixed to keep them from shadowing column names inside the
-- INSERT ... RETURNING below.
returns table (out_conversation_id uuid, out_access_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.conversations%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Reuse this visitor's most recent conversation rather than piling up rows
  -- on every reload.
  select * into v_existing
    from public.conversations
   where visitor_id = v_uid
   order by last_message_at desc
   limit 1;

  if found then
    update public.conversations
       set visitor_name = trim(p_name),
           visitor_email = lower(trim(p_email))
     where id = v_existing.id;
    return query select v_existing.id, v_existing.access_token;
    return;
  end if;

  -- Cheap abuse guard: cap conversations created from one uid.
  if (select count(*) from public.conversations where visitor_id = v_uid) >= 3 then
    raise exception 'too many conversations';
  end if;

  return query
    insert into public.conversations (visitor_id, visitor_name, visitor_email)
    values (v_uid, trim(p_name), lower(trim(p_email)))
    returning conversations.id, conversations.access_token;
end;
$$;

-- Re-points an existing conversation at the caller's anonymous uid, so the
-- emailed link opens the same thread on any device.
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

-- Visitor marks the admin's replies as read.
create or replace function public.mark_visitor_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set unread_for_visitor = 0
   where id = p_conversation_id
     and visitor_id = auth.uid();
end;
$$;

revoke all on function public.start_conversation(text, text) from public;
revoke all on function public.claim_conversation(uuid) from public;
revoke all on function public.mark_visitor_read(uuid) from public;
grant execute on function public.start_conversation(text, text) to authenticated;
grant execute on function public.claim_conversation(uuid) to authenticated;
grant execute on function public.mark_visitor_read(uuid) to authenticated;

-- Realtime -----------------------------------------------------------------
-- Realtime enforces the RLS policies above, so visitors only receive their own
-- messages and admins receive everything.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
