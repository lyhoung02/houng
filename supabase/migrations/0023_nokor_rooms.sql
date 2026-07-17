-- Nokor rooms: groups (everyone posts) and channels (admins broadcast, members
-- read). Same message feature set as DMs — attachments, reactions, replies,
-- edit/soft-delete, read marks.

create table if not exists public.nokor_rooms (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('group', 'channel')),
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text check (description is null or char_length(description) <= 300),
  photo_path text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.nokor_room_members (
  room_id uuid not null references public.nokor_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists nokor_room_members_user_idx on public.nokor_room_members (user_id);

alter table public.nokor_rooms enable row level security;
alter table public.nokor_room_members enable row level security;

-- Membership helpers. Security definer so the policies below can consult
-- membership without recursing back through RLS.
create or replace function public.nokor_in_room(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.nokor_room_members m
    where m.room_id = p_room and m.user_id = auth.uid()
  );
$$;

create or replace function public.nokor_room_role(p_room uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.nokor_room_members m
  where m.room_id = p_room and m.user_id = auth.uid();
$$;

/** Groups: any member posts. Channels: only owner/admin. */
create or replace function public.nokor_can_post_room(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.nokor_in_room(p_room) then false
    when (select kind from public.nokor_rooms where id = p_room) = 'group' then true
    else public.nokor_room_role(p_room) in ('owner', 'admin')
  end;
$$;

create policy "nokor rooms readable by members"
  on public.nokor_rooms for select
  using (public.nokor_in_room(id));

create policy "nokor rooms created by owner"
  on public.nokor_rooms for insert
  with check (owner_id = auth.uid());

create policy "nokor rooms updated by admins"
  on public.nokor_rooms for update
  using (public.nokor_room_role(id) in ('owner', 'admin'))
  with check (public.nokor_room_role(id) in ('owner', 'admin'));

create policy "nokor rooms deleted by owner"
  on public.nokor_rooms for delete
  using (owner_id = auth.uid());

create policy "nokor room members readable by members"
  on public.nokor_room_members for select
  using (public.nokor_in_room(room_id));

-- Admins add people; anyone may add themselves as the first row (room create).
create policy "nokor room members added by admins"
  on public.nokor_room_members for insert
  with check (
    user_id = auth.uid()
    or public.nokor_room_role(room_id) in ('owner', 'admin')
  );

-- Leave yourself, or be removed by an admin.
create policy "nokor room members removed"
  on public.nokor_room_members for delete
  using (
    user_id = auth.uid()
    or public.nokor_room_role(room_id) in ('owner', 'admin')
  );

create policy "nokor room member roles set by admins"
  on public.nokor_room_members for update
  using (public.nokor_room_role(room_id) in ('owner', 'admin'))
  with check (public.nokor_room_role(room_id) in ('owner', 'admin'));

-- Messages -------------------------------------------------------------------

create table if not exists public.nokor_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.nokor_rooms (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  kind text not null default 'text'
    check (kind in ('text', 'image', 'file', 'audio', 'video')),
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  attachment_mime text,
  duration_ms integer,
  reply_to_id uuid references public.nokor_room_messages (id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint nokor_room_messages_content_check check (
    char_length(body) <= 4000
    and (
      char_length(trim(body)) > 0
      or attachment_path is not null
      or deleted_at is not null
    )
  )
);

create index if not exists nokor_room_messages_room_idx
  on public.nokor_room_messages (room_id, created_at);

alter table public.nokor_room_messages enable row level security;

create policy "nokor room messages readable by members"
  on public.nokor_room_messages for select
  using (public.nokor_in_room(room_id));

create policy "nokor room messages sent by allowed posters"
  on public.nokor_room_messages for insert
  with check (sender_id = auth.uid() and public.nokor_can_post_room(room_id));

create policy "nokor room messages edited by author"
  on public.nokor_room_messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy "nokor room messages deleted by author or admin"
  on public.nokor_room_messages for delete
  using (sender_id = auth.uid() or public.nokor_room_role(room_id) in ('owner', 'admin'));

create or replace function public.nokor_can_see_room_message(p_message uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.nokor_room_messages m
    where m.id = p_message and public.nokor_in_room(m.room_id)
  );
$$;

create table if not exists public.nokor_room_reactions (
  message_id uuid not null references public.nokor_room_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.nokor_room_reactions enable row level security;

create policy "nokor room reactions readable by members"
  on public.nokor_room_reactions for select
  using (public.nokor_can_see_room_message(message_id));

create policy "nokor room react as self"
  on public.nokor_room_reactions for insert
  with check (user_id = auth.uid() and public.nokor_can_see_room_message(message_id));

create policy "nokor room unreact as self"
  on public.nokor_room_reactions for delete
  using (user_id = auth.uid());

create table if not exists public.nokor_room_reads (
  room_id uuid not null references public.nokor_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.nokor_room_reads enable row level security;

create policy "nokor room reads readable by members"
  on public.nokor_room_reads for select
  using (public.nokor_in_room(room_id));

create policy "nokor room read as self"
  on public.nokor_room_reads for insert
  with check (user_id = auth.uid() and public.nokor_in_room(room_id));

create policy "nokor room read update as self"
  on public.nokor_room_reads for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep room lists sorted by recency.
create or replace function public.nokor_touch_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.nokor_rooms set last_message_at = new.created_at where id = new.room_id;
  return new;
end;
$$;

drop trigger if exists nokor_room_touch on public.nokor_room_messages;
create trigger nokor_room_touch
  after insert on public.nokor_room_messages
  for each row execute function public.nokor_touch_room();

/*
 * Create a room and seed its membership in one call: the caller becomes owner
 * and the given users join as members. Doing this server-side avoids a window
 * where a room exists with no members (which RLS would then hide from everyone,
 * including its creator).
 */
create or replace function public.nokor_create_room(
  p_kind text,
  p_name text,
  p_description text default null,
  p_members uuid[] default '{}'
)
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
  if p_kind not in ('group', 'channel') then
    raise exception 'invalid room kind';
  end if;

  insert into public.nokor_rooms (kind, name, description, owner_id)
    values (p_kind, trim(p_name), nullif(trim(coalesce(p_description, '')), ''), me)
    returning id into rid;

  insert into public.nokor_room_members (room_id, user_id, role)
    values (rid, me, 'owner');

  if p_members is not null and array_length(p_members, 1) > 0 then
    insert into public.nokor_room_members (room_id, user_id, role)
    select rid, u, 'member'
      from unnest(p_members) as u
     where u <> me
    on conflict do nothing;
  end if;

  return rid;
end;
$$;

revoke all on function public.nokor_create_room(text, text, text, uuid[]) from public;
grant execute on function public.nokor_create_room(text, text, text, uuid[]) to authenticated;

alter publication supabase_realtime add table public.nokor_rooms;
alter publication supabase_realtime add table public.nokor_room_messages;
alter publication supabase_realtime add table public.nokor_room_reactions;
alter publication supabase_realtime add table public.nokor_room_reads;

-- Storage: room attachments key on <room_id>/<message_id>/<file>, so teach the
-- shared path checker about room membership too.
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

  if exists (
    select 1 from public.conversations c
     where c.id = v_id
       and (c.visitor_id = auth.uid() or public.is_admin())
  ) then
    return true;
  end if;

  if public.nokor_in_dm_thread(v_id) then
    return true;
  end if;

  return public.nokor_in_room(v_id);
end;
$$;
