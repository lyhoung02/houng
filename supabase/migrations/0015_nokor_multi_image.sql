-- Nokor multi-image posts: a post can carry several images (gallery). The old
-- single image_path stays for legacy rows; image_paths is the source of truth.

alter table public.nokor_posts
  add column if not exists image_paths text[] not null default '{}';

-- Fold any existing single-image rows into the array.
update public.nokor_posts
  set image_paths = array[image_path]
  where image_path is not null and cardinality(image_paths) = 0;

-- Replace the "must say or show something" check so image_paths counts too.
alter table public.nokor_posts drop constraint if exists nokor_posts_check;
alter table public.nokor_posts
  add constraint nokor_posts_content_check
  check (
    char_length(trim(body)) > 0
    or image_path is not null
    or cardinality(image_paths) > 0
  );
