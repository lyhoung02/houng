-- Facebook-style profile details. These live on the existing profiles table,
-- which is readable by any signed-in user (same as username/phone today) — so
-- only put things here that are meant to be shown on a profile.

alter table public.profiles
  add column if not exists work text
    check (work is null or char_length(work) <= 120),
  add column if not exists education text
    check (education is null or char_length(education) <= 120),
  add column if not exists hometown text
    check (hometown is null or char_length(hometown) <= 80),
  add column if not exists current_city text
    check (current_city is null or char_length(current_city) <= 80),
  add column if not exists relationship text
    check (
      relationship is null
      or relationship in (
        'single', 'in_a_relationship', 'engaged', 'married', 'complicated', 'private'
      )
    ),
  add column if not exists website text
    check (website is null or char_length(website) <= 200),
  add column if not exists birthday date,
  add column if not exists gender text
    check (gender is null or gender in ('female', 'male', 'other', 'private')),
  add column if not exists languages text[],
  add column if not exists created_at timestamptz not null default now();
