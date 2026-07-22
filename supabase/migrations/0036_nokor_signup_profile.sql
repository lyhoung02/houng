-- Signup collects a real identity: first/last name, gender, phone, and a
-- structured Cambodia address. The values travel as auth signup metadata
-- (email confirmation means there is no session to insert with), and a
-- trigger materialises the profile row the moment the auth user is created.

-- Name columns ---------------------------------------------------------------

alter table public.profiles
  add column if not exists first_name text
    check (first_name is null or char_length(trim(first_name)) between 1 and 40),
  add column if not exists last_name text
    check (last_name is null or char_length(trim(last_name)) between 1 and 40);

-- Create the profile from signup metadata ------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    user_id, first_name, last_name, username, phone, gender,
    current_province_code, current_district_code,
    current_commune_code, current_village_code, current_city
  )
  values (
    new.id,
    nullif(trim(meta->>'first_name'), ''),
    nullif(trim(meta->>'last_name'), ''),
    nullif(trim(concat_ws(' ', meta->>'first_name', meta->>'last_name')), ''),
    nullif(trim(meta->>'phone'), ''),
    case when meta->>'gender' in ('female', 'male', 'other', 'private')
         then meta->>'gender' end,
    nullif(meta->>'current_province_code', ''),
    nullif(meta->>'current_district_code', ''),
    nullif(meta->>'current_commune_code', ''),
    nullif(meta->>'current_village_code', ''),
    nullif(trim(meta->>'current_city'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Gazetteer readable pre-auth ------------------------------------------------
-- The signup form shows the address dropdowns before any session exists.
-- Public government reference data; nothing sensitive.

drop policy if exists "kh_provinces readable when signed in" on public.kh_provinces;
drop policy if exists "kh_districts readable when signed in" on public.kh_districts;
drop policy if exists "kh_communes readable when signed in" on public.kh_communes;
drop policy if exists "kh_villages readable when signed in" on public.kh_villages;

create policy "kh_provinces readable" on public.kh_provinces for select using (true);
create policy "kh_districts readable" on public.kh_districts for select using (true);
create policy "kh_communes readable" on public.kh_communes for select using (true);
create policy "kh_villages readable" on public.kh_villages for select using (true);
