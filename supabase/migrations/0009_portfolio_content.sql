-- Experience + education move from the static bundle into the database, so
-- entries can be added or edited in the dashboard's Table Editor with no
-- redeploy. Public read (it's the public portfolio), admin-only writes.

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  role text not null,
  company text not null,
  period text not null,
  location text not null default '',
  logo text not null default '',
  logo_mode text not null default 'image' check (logo_mode in ('image', 'wordmark')),
  bullets text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.education_items (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  title text not null,
  org text not null,
  period text not null,
  detail text not null default '',
  logo text not null default '',
  major text,
  result text,
  courses text[],
  created_at timestamptz not null default now()
);

alter table public.experiences enable row level security;
alter table public.education_items enable row level security;

-- Anyone may read — including visitors with no session at all.
drop policy if exists "experiences are public" on public.experiences;
create policy "experiences are public"
  on public.experiences for select
  using (true);

drop policy if exists "education is public" on public.education_items;
create policy "education is public"
  on public.education_items for select
  using (true);

drop policy if exists "admin manages experiences" on public.experiences;
create policy "admin manages experiences"
  on public.experiences for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin manages education" on public.education_items;
create policy "admin manages education"
  on public.education_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed from the current static data (idempotent: skip if already populated).

insert into public.experiences (sort_order, role, company, period, location, logo, logo_mode, bullets)
select * from (values
  (1, 'Software Engineer', 'E-Power CCL', 'Dec 2026 — Present', 'Phnom Penh',
   '/assets/projects/epower.png', 'wordmark', array[
     'Applying production experience from E-Power projects with the Bachelor of Computer Science foundation from Norton University.',
     'Designing maintainable software across backend, web, and mobile systems with stronger ownership of architecture and delivery quality.',
     'Continuing to grow through the Master of Science in Information Technology while building reliable customer-facing products.'
   ]),
  (2, 'Full-stack Developer', 'E-Power CCL', 'Dec 2025 — Dec 2026', 'Phnom Penh',
   '/assets/projects/epower.png', 'wordmark', array[
     'Built end-to-end features across Solar, EAC App, E-Power Maps, and Mobile Billing using Flutter, Next.js, .NET, and SQL-backed APIs.',
     'Connected frontend flows to backend services, modeled data, integrated REST APIs, and supported production releases.',
     'Improved product reliability through bug fixes, performance tuning, and maintenance against live customer data.'
   ]),
  (3, 'Junior Developer', 'E-Power CCL', 'Dec 2023 — Dec 2025', 'Phnom Penh',
   '/assets/projects/epower.png', 'wordmark', array[
     'Started as a junior developer while studying Computer Science, turning coursework in programming, databases, and software engineering into real product work.',
     'Supported Flutter mobile screens, web UI, API integration, and testing for internal and customer-facing E-Power products.',
     'Learned production workflows with GitLab, Docker, debugging, code review, and cross-team collaboration.'
   ]),
  (4, 'Developer (Freelance)', 'Max Freelance Team', 'Jun — Dec 2025', 'Remote · Phnom Penh',
   '/assets/work/max-freelance.svg', 'image', array[
     'Joined Max''s freelance team to build a House IoT product — smart-home device control, telemetry, and a companion mobile experience.',
     'Worked on the developer side end-to-end: device integration, data pipelines from sensors, and feature flows in the app.',
     'Coordinated with a distributed freelance team on delivery cadence, code reviews, and shared environments.'
   ]),
  (5, 'UX / UI Designer (Freelance)', 'Freelance Team · RUPP Students', 'Feb — Apr 2024', 'Phnom Penh',
   '/assets/work/rupp-design.svg', 'image', array[
     'Joined a freelance team of RUPP (Royal University of Phnom Penh) students to design an Online Coffee Shop website.',
     'Led UX flows and high-fidelity UI: home, menu, product detail, cart, and checkout — including responsive behavior.',
     'Produced design specs and handed off assets to the engineering side of the team.'
   ])
) as v(sort_order, role, company, period, location, logo, logo_mode, bullets)
where not exists (select 1 from public.experiences);

insert into public.education_items (sort_order, title, org, period, detail, logo, major, result, courses)
select * from (values
  (1, 'Master of Science in Information Technology', 'Norton University', 'Oct 2026 - Present',
   'Graduate program advancing software engineering, distributed systems, and applied research — building on the Bachelor program at Norton.',
   '/assets/norton.png', null, null, null::text[]),
  (2, 'English Level 8 (Part-time)', 'Pannasastra University of Cambodia (PUC)', 'Feb 2026 — Present',
   'Advanced English program at PUC — academic writing, professional communication, and technical reading.',
   '/assets/puc-nobg.png', null, null, null),
  (3, 'Bachelor of Computer Science', 'Norton University', 'Mar 2022 — May 2026',
   'Four-year program spanning software engineering, data structures and algorithms, databases, networking, AI, big data, and mobile and web development — capped with a research study and thesis.',
   '/assets/norton.png', 'Major: Software Development · College of Science',
   'Final result: Pass · Total average 75.22', array[
     'Computing Fundamentals',
     'Mathematics for Computer Science I & II',
     'Programming Methodology in C/C++',
     'Object-Oriented Modeling & Programming',
     'Data Structures and Algorithms',
     'Java Programming I',
     'Advanced Java Programming',
     'Advanced Application Development (OOP & Mobile Applied)',
     'Mobile Apps Development',
     'Advanced Mobile Apps Development',
     'Web Development',
     'Advanced Web Development',
     'UX/UI Design',
     'Digital Design',
     'Digital Image Processing',
     'Database Administration',
     'Introduction to Networks',
     'System Analysis and Design',
     'Software Engineering',
     'Software Security Technology',
     'Introduction to Artificial Intelligence (AI)',
     'AI Expert System Development',
     'Introduction to Big Data',
     'Big Data Analysis',
     'Business Intelligence',
     'Management Information System (MIS)',
     'Introduction to Internet of Things (IoT)',
     'Methods of Research and Thesis Writing',
     'Core English 1A & 1B',
     'Core English and Writing II',
     'Human and Society',
     'Khmer Studies',
     'Principles of Business',
     'Principles of Economics'
   ]),
  (4, 'Flutter & Dart 3.0 (Part-time)', 'Instinct InstiSuite', 'Feb — Jul 2024',
   'Cross-platform mobile development with Dart 3.0, state management, REST integration, and production deployment.',
   '/assets/instinct-nobg.png', null, null, null),
  (5, 'C / C++ Programming (Part-time)', 'ETEC Training Center', 'Jul — Nov 2023',
   'Memory model, pointers, data structures, and systems-level problem solving with C and C++.',
   '/assets/etec.png', null, null, null)
) as v(sort_order, title, org, period, detail, logo, major, result, courses)
where not exists (select 1 from public.education_items);
