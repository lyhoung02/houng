-- Nokor server-stamped timestamps and content constraints.
--
-- created_at / edited_at are currently client-clock values, and several limits
-- (image count, story expiry window, background preset, reaction emoji) are
-- enforced only in the UI — a raw PostgREST write bypasses them. This migration
-- moves those to the database. Body-length and "must have content" checks
-- already exist from the original migrations and are not repeated.

-- Server-stamped timestamps --------------------------------------------------
-- created_at is set to now() on insert and made immutable on update. edited_at
-- is stamped server-side when a body actually changes (and, for messages, only
-- when the row is not being soft-deleted).

create or replace function public.nokor_stamp_created()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;
  return new;
end; $$;

create or replace function public.nokor_stamp_post()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
    if new.body is distinct from old.body then
      new.edited_at := now();
    end if;
  end if;
  return new;
end; $$;

create or replace function public.nokor_stamp_message()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
    if new.body is distinct from old.body and new.deleted_at is null then
      new.edited_at := now();
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists nokor_stamp_post_trg on public.nokor_posts;
create trigger nokor_stamp_post_trg
  before insert or update on public.nokor_posts
  for each row execute function public.nokor_stamp_post();

drop trigger if exists nokor_stamp_comment_trg on public.nokor_comments;
create trigger nokor_stamp_comment_trg
  before insert or update on public.nokor_comments
  for each row execute function public.nokor_stamp_created();

drop trigger if exists nokor_stamp_story_trg on public.nokor_stories;
create trigger nokor_stamp_story_trg
  before insert or update on public.nokor_stories
  for each row execute function public.nokor_stamp_created();

drop trigger if exists nokor_stamp_dm_message_trg on public.nokor_dm_messages;
create trigger nokor_stamp_dm_message_trg
  before insert or update on public.nokor_dm_messages
  for each row execute function public.nokor_stamp_message();

drop trigger if exists nokor_stamp_room_message_trg on public.nokor_room_messages;
create trigger nokor_stamp_room_message_trg
  before insert or update on public.nokor_room_messages
  for each row execute function public.nokor_stamp_message();

-- Content constraints --------------------------------------------------------
-- Added NOT VALID: they enforce all future writes without scanning (or failing
-- on) any pre-existing rows.

alter table public.nokor_posts drop constraint if exists nokor_posts_image_cap;
alter table public.nokor_posts
  add constraint nokor_posts_image_cap
  check (cardinality(image_paths) <= 6) not valid;

alter table public.nokor_stories drop constraint if exists nokor_stories_background_check;
alter table public.nokor_stories
  add constraint nokor_stories_background_check
  check (background is null or background in ('indigo', 'sunset', 'ocean', 'forest', 'gold', 'night'))
  not valid;

alter table public.nokor_stories drop constraint if exists nokor_stories_expiry_window;
alter table public.nokor_stories
  add constraint nokor_stories_expiry_window
  check (expires_at > created_at and expires_at <= created_at + interval '49 hours')
  not valid;

-- Reactions are limited to the fixed quick-reaction set the UI offers.
alter table public.nokor_dm_reactions drop constraint if exists nokor_dm_reactions_emoji_check;
alter table public.nokor_dm_reactions
  add constraint nokor_dm_reactions_emoji_check
  check (emoji in ('❤️', '😂', '👍', '😮', '😢', '🔥')) not valid;

alter table public.nokor_room_reactions drop constraint if exists nokor_room_reactions_emoji_check;
alter table public.nokor_room_reactions
  add constraint nokor_room_reactions_emoji_check
  check (emoji in ('❤️', '😂', '👍', '😮', '😢', '🔥')) not valid;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '29')
on conflict (key) do update set value = excluded.value;
