-- Login activity: expose a user's OWN auth sessions and audit-log entries.
-- Supabase records these automatically (auth.sessions, auth.audit_log_entries);
-- these security-definer functions let the signed-in client read only its own
-- rows — the auth schema itself stays unreachable from the API.

create or replace function public.nokor_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.user_agent,
    s.ip::text,
    s.id::text = coalesce(auth.jwt()->>'session_id', '') as is_current
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.updated_at desc;
$$;

create or replace function public.nokor_my_login_history()
returns table (
  action text,
  ip text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    a.payload->>'action',
    a.ip_address,
    a.created_at
  from auth.audit_log_entries a
  where a.payload->>'actor_id' = auth.uid()::text
  order by a.created_at desc
  limit 50;
$$;

revoke all on function public.nokor_my_sessions() from public;
revoke all on function public.nokor_my_login_history() from public;
grant execute on function public.nokor_my_sessions() to authenticated;
grant execute on function public.nokor_my_login_history() to authenticated;
