-- Nokor stories: 24-hour ephemeral image posts shown as a ring tray, plus
-- per-viewer "seen" tracking. Images reuse the nokor-media bucket (path is
-- <user_id>/story-... so the existing owner-write policy applies).

create table if not exists public.nokor_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  caption text check (caption is null or char_length(caption) <= 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists nokor_stories_expires_idx on public.nokor_stories (expires_at);

alter table public.nokor_stories enable row level security;

create policy "nokor stories readable when signed in"
  on public.nokor_stories for select
  using (auth.uid() is not null);

create policy "nokor insert own story"
  on public.nokor_stories for insert
  with check (user_id = auth.uid());

create policy "nokor delete own story"
  on public.nokor_stories for delete
  using (user_id = auth.uid() or public.is_admin());

-- Views: one row per (story, viewer). Powers the seen/unseen ring and the
-- viewer count an author sees on their own story.
create table if not exists public.nokor_story_views (
  story_id uuid not null references public.nokor_stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

alter table public.nokor_story_views enable row level security;

create policy "nokor story views readable when signed in"
  on public.nokor_story_views for select
  using (auth.uid() is not null);

create policy "nokor mark story viewed as self"
  on public.nokor_story_views for insert
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.nokor_stories;
alter publication supabase_realtime add table public.nokor_story_views;
