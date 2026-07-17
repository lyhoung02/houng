-- Service cards on the About page. Unlike the other portfolio tables these are
-- bilingual (the site shows them in English and Khmer), so each row carries
-- both languages; the client picks by the visitor's language. `key` selects
-- the icon in the UI's icon map.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  key text not null unique,
  title_en text not null,
  title_km text not null,
  desc_en text not null,
  desc_km text not null
);

alter table public.services enable row level security;

drop policy if exists "public read" on public.services;
create policy "public read" on public.services for select using (true);

drop policy if exists "admin writes" on public.services;
create policy "admin writes" on public.services for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.services (sort_order, key, title_en, title_km, desc_en, desc_km)
select * from (values
  (1, 'backend',
   'Backend Engineering', 'Backend Engineering',
   'REST APIs, data modeling, and system design with Node.js, .NET, and SQL/PostgreSQL.',
   'បង្កើត REST API, រចនាមូលដ្ឋានទិន្នន័យ និងប្រព័ន្ធជាមួយ Node.js, .NET, និង SQL / PostgreSQL។'),
  (2, 'frontend',
   'Frontend & Web', 'Frontend & Web',
   'Modern web UIs with Next.js, React, and a deep HTML/CSS/JS foundation.',
   'បង្កើតគេហទំព័រទំនើបជាមួយ Next.js, React និងគ្រឹះ HTML / CSS / JS ដ៏រឹងមាំ។'),
  (3, 'mobile',
   'Mobile (Flutter)', 'Mobile (Flutter)',
   'Cross-platform iOS & Android apps with Dart 3, REST integration, and offline flows.',
   'បង្កើតកម្មវិធី iOS និង Android cross-platform ជាមួយ Dart 3, REST API និង offline flow។'),
  (4, 'devops',
   'DevOps & Cloud', 'DevOps & Cloud',
   'Docker, Kubernetes, AWS, Render, Supabase, Firebase — shipping and keeping things up.',
   'Docker, Kubernetes, AWS, Render, Supabase, Firebase — ការដាក់ឲ្យដំណើរការ និងថែទាំ។'),
  (5, 'ai',
   'AI-Augmented Builds', 'បង្កើតជាមួយ AI',
   'Pairing with Claude, ChatGPT, Gemini, Codex & Grok to ship faster without losing the craft.',
   'ធ្វើការជាគូជាមួយ Claude, ChatGPT, Gemini, Codex និង Grok ដើម្បីផលិតការងារកាន់តែលឿន។'),
  (6, 'leadership',
   'Leadership & PM', 'ដឹកនាំ & គ្រប់គ្រងគម្រោង',
   'Project management & team leadership for outsourcing — scoping, planning, delivering.',
   'គ្រប់គ្រងគម្រោង និងដឹកនាំក្រុមសម្រាប់ Outsourcing — កំណត់វិសាលភាព ផែនការ និងប្រគល់ការងារ។')
) as v(sort_order, key, title_en, title_km, desc_en, desc_km)
where not exists (select 1 from public.services);
