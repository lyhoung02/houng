-- Nokor social graph: follow relationships and a profile bio.

alter table public.profiles
  add column if not exists bio text
    check (bio is null or char_length(bio) <= 300);

create table if not exists public.nokor_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists nokor_follows_following_idx
  on public.nokor_follows (following_id);

alter table public.nokor_follows enable row level security;

create policy "nokor follows readable when signed in"
  on public.nokor_follows for select
  using (auth.uid() is not null);

create policy "nokor follow as self"
  on public.nokor_follows for insert
  with check (follower_id = auth.uid());

create policy "nokor unfollow as self"
  on public.nokor_follows for delete
  using (follower_id = auth.uid());

alter publication supabase_realtime add table public.nokor_follows;
