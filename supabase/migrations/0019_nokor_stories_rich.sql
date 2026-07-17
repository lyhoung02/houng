-- Nokor stories, richer: text stories (coloured background) alongside image
-- stories, author-chosen expiry, and per-viewer hiding.

-- Text stories carry no image, so image_path becomes optional and a check
-- enforces that each kind has the content it needs.
alter table public.nokor_stories
  alter column image_path drop not null;

alter table public.nokor_stories
  add column if not exists kind text not null default 'image'
    check (kind in ('image', 'text')),
  add column if not exists background text;

alter table public.nokor_stories drop constraint if exists nokor_stories_content_check;
alter table public.nokor_stories
  add constraint nokor_stories_content_check
  check (
    (kind = 'image' and image_path is not null)
    or (kind = 'text' and caption is not null and char_length(trim(caption)) > 0)
  );

-- Hide list: viewers the author excluded from a story ------------------------

create table if not exists public.nokor_story_hidden (
  story_id uuid not null references public.nokor_stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

alter table public.nokor_story_hidden enable row level security;

-- Only the story's author can see or manage who it is hidden from.
create policy "nokor story hidden readable by author"
  on public.nokor_story_hidden for select
  using (
    exists (
      select 1 from public.nokor_stories s
      where s.id = story_id and s.user_id = auth.uid()
    )
  );

create policy "nokor story hidden set by author"
  on public.nokor_story_hidden for insert
  with check (
    exists (
      select 1 from public.nokor_stories s
      where s.id = story_id and s.user_id = auth.uid()
    )
  );

create policy "nokor story hidden cleared by author"
  on public.nokor_story_hidden for delete
  using (
    exists (
      select 1 from public.nokor_stories s
      where s.id = story_id and s.user_id = auth.uid()
    )
  );

-- Security definer so the stories SELECT policy can consult the hide list
-- without needing read access to it (and without recursing through RLS).
create or replace function public.nokor_hidden_from_story(p_story uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.nokor_story_hidden h
    where h.story_id = p_story and h.user_id = auth.uid()
  );
$$;

-- Replace the plain "signed in" read policy with one that honours the hide
-- list. Authors always see their own stories.
drop policy if exists "nokor stories readable when signed in" on public.nokor_stories;
drop policy if exists "nokor stories visible" on public.nokor_stories;
create policy "nokor stories visible"
  on public.nokor_stories for select
  using (
    auth.uid() is not null
    and (user_id = auth.uid() or not public.nokor_hidden_from_story(id))
  );
