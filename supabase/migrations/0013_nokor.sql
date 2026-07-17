-- Nokor: a small social feed (posts + likes + comments) on top of the
-- existing auth.users / profiles. Signed-in users post text with an optional
-- image; everyone signed in can read the feed.

-- Posts ----------------------------------------------------------------------

create table if not exists public.nokor_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  image_path text,
  created_at timestamptz not null default now(),
  -- A post must say or show something.
  check (char_length(trim(body)) > 0 or image_path is not null)
);

create index if not exists nokor_posts_created_at_idx on public.nokor_posts (created_at desc);

alter table public.nokor_posts enable row level security;

create policy "fk posts readable when signed in"
  on public.nokor_posts for select
  using (auth.uid() is not null);

create policy "fk insert own post"
  on public.nokor_posts for insert
  with check (user_id = auth.uid());

create policy "fk delete own post"
  on public.nokor_posts for delete
  using (user_id = auth.uid() or public.is_admin());

-- Likes ----------------------------------------------------------------------

create table if not exists public.nokor_likes (
  post_id uuid not null references public.nokor_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.nokor_likes enable row level security;

create policy "fk likes readable when signed in"
  on public.nokor_likes for select
  using (auth.uid() is not null);

create policy "fk like as self"
  on public.nokor_likes for insert
  with check (user_id = auth.uid());

create policy "fk unlike as self"
  on public.nokor_likes for delete
  using (user_id = auth.uid());

-- Comments -------------------------------------------------------------------

create table if not exists public.nokor_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.nokor_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists nokor_comments_post_idx on public.nokor_comments (post_id, created_at);

alter table public.nokor_comments enable row level security;

create policy "fk comments readable when signed in"
  on public.nokor_comments for select
  using (auth.uid() is not null);

create policy "fk comment as self"
  on public.nokor_comments for insert
  with check (user_id = auth.uid());

create policy "fk delete own comment"
  on public.nokor_comments for delete
  using (user_id = auth.uid() or public.is_admin());

-- Realtime -------------------------------------------------------------------

alter publication supabase_realtime add table public.nokor_posts;
alter publication supabase_realtime add table public.nokor_likes;
alter publication supabase_realtime add table public.nokor_comments;

-- Post images ----------------------------------------------------------------
-- Public bucket like avatars: feed images render for everyone signed in and
-- carry no secrets. Path is <user_id>/<file>, writable only by that user.

insert into storage.buckets (id, name, public, file_size_limit)
values ('nokor-media', 'nokor-media', true, 5242880) -- 5 MB
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "fk media readable" on storage.objects;
create policy "fk media readable"
  on storage.objects for select
  using (bucket_id = 'nokor-media');

drop policy if exists "fk media write own" on storage.objects;
create policy "fk media write own"
  on storage.objects for insert
  with check (
    bucket_id = 'nokor-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fk media delete own" on storage.objects;
create policy "fk media delete own"
  on storage.objects for delete
  using (
    bucket_id = 'nokor-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
