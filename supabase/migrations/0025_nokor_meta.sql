-- Nokor schema contract version.
--
-- src/lib/supabase/types.ts is hand-written to mirror these migrations, so the
-- deployed static client and the live schema can silently drift. This table
-- records an integer schema version; the client reads it at boot and, when its
-- compiled version is lower, shows a non-blocking "reload for the latest"
-- notice. Every later migration that changes a client-visible table, RPC, or
-- policy bumps this value to its own migration number.

create table if not exists public.nokor_meta (
  key text primary key,
  value text not null
);

alter table public.nokor_meta enable row level security;

-- World-readable (not sensitive) so the client can check the version even
-- before authentication. Values are written by migrations only — no write
-- policy is granted to any client role.
drop policy if exists "nokor meta readable" on public.nokor_meta;
create policy "nokor meta readable"
  on public.nokor_meta for select
  using (true);

insert into public.nokor_meta (key, value) values ('schema_version', '25')
on conflict (key) do update set value = excluded.value;
