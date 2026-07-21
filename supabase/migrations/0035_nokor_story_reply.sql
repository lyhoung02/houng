-- Story replies: replying to someone's story sends a DM to the author that
-- quotes the story (Facebook/Messenger behaviour). The reply is a normal DM
-- message with two extra, nullable fields:
--   story_id       — the story it answers (nulled if the story is deleted)
--   story_snapshot — a small copy of the story so the quote still renders
--                    after the story expires: { kind, caption, image_path, background }

alter table public.nokor_dm_messages
  add column if not exists story_id uuid references public.nokor_stories (id) on delete set null,
  add column if not exists story_snapshot jsonb;

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '34')
on conflict (key) do update set value = excluded.value;
