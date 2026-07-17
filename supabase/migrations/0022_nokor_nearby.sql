-- "People near you" suggestions.
--
-- PRIVACY: coordinates are readable ONLY by the user they belong to — there is
-- no SELECT policy granting anyone else access. Proximity is resolved inside a
-- security-definer function that returns a rounded distance and never exposes
-- another user's latitude/longitude.

create table if not exists public.nokor_user_locations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  updated_at timestamptz not null default now()
);

alter table public.nokor_user_locations enable row level security;

-- Own row only, in every direction. Sharing is opt-in: no row, no suggestions.
create policy "nokor location readable by owner"
  on public.nokor_user_locations for select
  using (user_id = auth.uid());

create policy "nokor location insert own"
  on public.nokor_user_locations for insert
  with check (user_id = auth.uid());

create policy "nokor location update own"
  on public.nokor_user_locations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Opting out deletes the row entirely.
create policy "nokor location delete own"
  on public.nokor_user_locations for delete
  using (user_id = auth.uid());

-- Great-circle distance in kilometres.
create or replace function public.nokor_distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371 * 2 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians(lng2 - lng1) / 2), 2)
    )
  );
$$;

/*
 * People within p_radius_km of the caller, excluding themselves and anyone
 * they already follow. Returns profile fields plus a distance rounded to one
 * decimal — never the other person's coordinates. Runs as definer purely to
 * read other rows in nokor_user_locations; nothing sensitive escapes.
 */
create or replace function public.nokor_nearby_users(p_radius_km double precision default 10)
returns table (
  user_id uuid,
  username text,
  avatar_path text,
  bio text,
  current_city text,
  distance_km double precision,
  is_new boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select lat, lng from public.nokor_user_locations where user_id = auth.uid()
  )
  select
    l.user_id,
    p.username,
    p.avatar_path,
    p.bio,
    p.current_city,
    round(public.nokor_distance_km(me.lat, me.lng, l.lat, l.lng)::numeric, 1)::double precision,
    (u.created_at > now() - interval '7 days') as is_new
  from public.nokor_user_locations l
  cross join me
  join auth.users u on u.id = l.user_id
  left join public.profiles p on p.user_id = l.user_id
  where auth.uid() is not null
    and l.user_id <> auth.uid()
    and public.nokor_distance_km(me.lat, me.lng, l.lat, l.lng) <= p_radius_km
    and not exists (
      select 1 from public.nokor_follows f
       where f.follower_id = auth.uid() and f.following_id = l.user_id
    )
  order by is_new desc, 6 asc
  limit 50;
$$;

revoke all on function public.nokor_nearby_users(double precision) from public;
grant execute on function public.nokor_nearby_users(double precision) to authenticated;
