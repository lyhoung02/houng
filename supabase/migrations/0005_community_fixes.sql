-- Fixes for the community room:
--   1) Admins couldn't post: the insert policy required from_admin = false,
--      but WITH CHECK is evaluated AFTER before-triggers run — and the trigger
--      had already stamped from_admin = true for admins, so their own inserts
--      violated the policy. Dropping the clause is safe: the trigger overwrites
--      from_admin unconditionally, so a client can't forge it either way.
--   2) Welcome notice when someone joins (system message).
--   3) profiles join the realtime publication, so name/avatar edits appear
--      in open chats immediately.

-- System notices (rendered centered, not as a bubble). body holds the
-- joiner's display name; each client localises the surrounding text.
-- Added before the policy below, which references it.
alter table public.community_messages
  add column if not exists is_system boolean not null default false;

drop policy if exists "community write as self" on public.community_messages;
create policy "community write as self"
  on public.community_messages for insert
  with check (
    user_id = auth.uid()
    and edited_at is null
    and deleted_at is null
    -- Safe here (unlike from_admin): no trigger rewrites is_system, so a
    -- client sending true is simply rejected.
    and is_system = false
    and (public.is_community_member() or public.is_admin())
  );

create or replace function public.on_community_member_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_messages (user_id, body, kind, is_system)
  values (
    new.user_id,
    coalesce(
      (select nullif(trim(p.username), '') from public.profiles p
        where p.user_id = new.user_id),
      'user-' || left(new.user_id::text, 4)
    ),
    'text',
    true
  );
  return new;
end;
$$;

drop trigger if exists community_members_after_join on public.community_members;
create trigger community_members_after_join
  after insert on public.community_members
  for each row execute function public.on_community_member_join();

alter publication supabase_realtime add table public.profiles;
