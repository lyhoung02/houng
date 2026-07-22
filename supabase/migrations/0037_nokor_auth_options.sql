-- Google OAuth + phone sign-in support.
--
-- 1. handle_new_user learns Google's metadata shape (given_name/family_name)
--    so OAuth signups get a named profile too.
-- 2. nokor_email_for_phone lets the sign-in form accept a phone number: the
--    client resolves it to the account email, then signs in with password.
--    Trade-off: given an exact registered phone number, the email it belongs
--    to can be looked up. Acceptable here — phones are chosen identifiers.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := coalesce(
    nullif(trim(meta->>'first_name'), ''),
    nullif(trim(meta->>'given_name'), '')
  );
  v_last text := coalesce(
    nullif(trim(meta->>'last_name'), ''),
    nullif(trim(meta->>'family_name'), '')
  );
begin
  insert into public.profiles (
    user_id, first_name, last_name, username, phone, gender,
    current_province_code, current_district_code,
    current_commune_code, current_village_code, current_city
  )
  values (
    new.id,
    v_first,
    v_last,
    coalesce(
      nullif(trim(concat_ws(' ', v_first, v_last)), ''),
      nullif(trim(meta->>'name'), '')
    ),
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

create or replace function public.nokor_email_for_phone(phone_arg text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where p.phone = trim(phone_arg)
  limit 1;
$$;

revoke all on function public.nokor_email_for_phone(text) from public;
grant execute on function public.nokor_email_for_phone(text) to anon, authenticated;
