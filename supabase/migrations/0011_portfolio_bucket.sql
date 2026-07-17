-- Public bucket for portfolio images (logos, archive scans). Public read —
-- these render on the public site — and admin-only writes. Future images:
-- upload here via the dashboard (Storage -> portfolio) and paste the public
-- URL into the table row.

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "portfolio images readable" on storage.objects;
create policy "portfolio images readable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "portfolio images admin insert" on storage.objects;
create policy "portfolio images admin insert"
  on storage.objects for insert
  with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "portfolio images admin update" on storage.objects;
create policy "portfolio images admin update"
  on storage.objects for update
  using (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "portfolio images admin delete" on storage.objects;
create policy "portfolio images admin delete"
  on storage.objects for delete
  using (bucket_id = 'portfolio' and public.is_admin());
