-- Nokor feed polish: editable posts, threaded comment replies, comment likes.

-- Editable posts -------------------------------------------------------------

alter table public.nokor_posts
  add column if not exists edited_at timestamptz;

drop policy if exists "nokor update own post" on public.nokor_posts;
create policy "nokor update own post"
  on public.nokor_posts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Threaded replies -----------------------------------------------------------
-- A comment may point at a parent comment on the same post. One level of
-- nesting is all the UI renders; deeper chains still resolve to their top
-- ancestor visually.

alter table public.nokor_comments
  add column if not exists reply_to_id uuid
    references public.nokor_comments (id) on delete cascade;

-- Comment likes --------------------------------------------------------------

create table if not exists public.nokor_comment_likes (
  comment_id uuid not null references public.nokor_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.nokor_comment_likes enable row level security;

create policy "nokor comment likes readable when signed in"
  on public.nokor_comment_likes for select
  using (auth.uid() is not null);

create policy "nokor comment like as self"
  on public.nokor_comment_likes for insert
  with check (user_id = auth.uid());

create policy "nokor comment unlike as self"
  on public.nokor_comment_likes for delete
  using (user_id = auth.uid());

alter publication supabase_realtime add table public.nokor_comment_likes;
