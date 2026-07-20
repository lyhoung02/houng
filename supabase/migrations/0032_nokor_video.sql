-- Nokor video: video posts in the feed, and room to send real videos in chat.
--
-- No server-side transcoding (a static app can't run ffmpeg) — clients upload
-- the file as-is, so the size cap is the only enforceable bound. Both media
-- buckets are raised to 50 MB; the per-image 5 MB guard stays client-side.

-- Video posts ----------------------------------------------------------------

alter table public.nokor_posts
  add column if not exists video_path text;

-- A post may now be a video with no body or images.
alter table public.nokor_posts drop constraint if exists nokor_posts_content_check;
alter table public.nokor_posts
  add constraint nokor_posts_content_check check (
    char_length(trim(body)) > 0
    or image_path is not null
    or cardinality(image_paths) > 0
    or video_path is not null
  );

-- Bucket limits (50 MB) ------------------------------------------------------

update storage.buckets set file_size_limit = 52428800 where id = 'nokor-media';
update storage.buckets set file_size_limit = 52428800 where id = 'chat-attachments';

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '32')
on conflict (key) do update set value = excluded.value;
