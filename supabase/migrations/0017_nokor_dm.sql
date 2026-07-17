-- Nokor direct messages: 1:1 threads between two users. A thread is keyed by
-- the ordered pair (user_lo, user_hi) so each pair has exactly one thread.

create table if not exists public.nokor_dm_threads (
  id uuid primary key default gen_random_uuid(),
  user_lo uuid not null references auth.users (id) on delete cascade,
  user_hi uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_lo < user_hi),
  unique (user_lo, user_hi)
);

alter table public.nokor_dm_threads enable row level security;

-- Membership check (security definer so the message policies can call it
-- without recursing through RLS).
create or replace function public.nokor_in_dm_thread(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.nokor_dm_threads t
    where t.id = p_thread and auth.uid() in (t.user_lo, t.user_hi)
  );
$$;

create policy "nokor dm threads readable by participants"
  on public.nokor_dm_threads for select
  using (auth.uid() in (user_lo, user_hi));

create table if not exists public.nokor_dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.nokor_dm_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists nokor_dm_messages_thread_idx
  on public.nokor_dm_messages (thread_id, created_at);

alter table public.nokor_dm_messages enable row level security;

create policy "nokor dm messages readable by participants"
  on public.nokor_dm_messages for select
  using (public.nokor_in_dm_thread(thread_id));

create policy "nokor dm send as self in thread"
  on public.nokor_dm_messages for insert
  with check (sender_id = auth.uid() and public.nokor_in_dm_thread(thread_id));

-- Get-or-create the thread with another user, returning its id. Ordering the
-- pair here keeps the unique constraint doing the de-duplication.
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

-- Bump last_message_at so thread lists sort by recency.
create or replace function public.nokor_touch_dm_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.nokor_dm_threads
    set last_message_at = new.created_at
    where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists nokor_dm_touch on public.nokor_dm_messages;
create trigger nokor_dm_touch
  after insert on public.nokor_dm_messages
  for each row execute function public.nokor_touch_dm_thread();

alter publication supabase_realtime add table public.nokor_dm_threads;
alter publication supabase_realtime add table public.nokor_dm_messages;
