-- Read receipts.
--   1:1 chat: one last-read timestamp per side on the conversation — a message
--   is "seen" when the other side's timestamp passes its created_at.
--   Community: one last-read timestamp per member (community_reads); "who has
--   seen message X" = members whose timestamp is >= X.created_at.

alter table public.conversations
  add column if not exists visitor_last_read_at timestamptz not null default now(),
  add column if not exists admin_last_read_at timestamptz not null default now();

-- Visitor's mark-read now also stamps the receipt time. (The admin side
-- updates its own columns directly — its UPDATE policy already allows that.)
create or replace function public.mark_visitor_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set unread_for_visitor = 0,
         visitor_last_read_at = now()
   where id = p_conversation_id
     and visitor_id = auth.uid();
end;
$$;

-- Community ------------------------------------------------------------------

create table if not exists public.community_reads (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now()
);

alter table public.community_reads enable row level security;

drop policy if exists "community reads visible to members" on public.community_reads;
create policy "community reads visible to members"
  on public.community_reads for select
  using (public.is_community_member() or public.is_admin());

drop policy if exists "mark community read as self" on public.community_reads;
create policy "mark community read as self"
  on public.community_reads for insert
  with check (user_id = auth.uid());

drop policy if exists "update community read as self" on public.community_reads;
create policy "update community read as self"
  on public.community_reads for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.community_reads;
exception when duplicate_object then
  null; -- already in the publication
end $$;
