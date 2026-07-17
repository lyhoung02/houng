-- The rest of the portfolio content moves into the database: profile,
-- projects, personal projects, internal projects, skill groups, archive.
-- Same model as 0009: public read, admin-only writes, static bundle as
-- fallback. Generated from src/lib/portfolio-data.ts.

create table if not exists public.site_profile (
  id int primary key default 1 check (id = 1),
  name text not null,
  initials text not null default '',
  age int,
  title text not null default '',
  subtitle text not null default '',
  location text not null default '',
  email text not null default '',
  work_email text not null default '',
  phones text[] not null default '{}',
  address text not null default '',
  pitch text not null default '',
  long_pitch text not null default '',
  stats jsonb not null default '[]'
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  roles text[] not null default '{}',
  stack text[] not null default '{}',
  logo text not null default '',
  accent text not null default '',
  highlights text[] not null default '{}'
);

create table if not exists public.personal_projects (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  stack text[] not null default '{}',
  logo text not null default '',
  accent text not null default '',
  status text not null default 'Research' check (status in ('Research', 'Active', 'Shipped')),
  highlights text[] not null default '{}'
);

create table if not exists public.internal_projects (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  slug text not null unique,
  period text not null default '',
  name text not null,
  tagline text not null default '',
  description text not null default '',
  stack text[] not null default '{}',
  difficulty text not null default 'Challenging'
    check (difficulty in ('Challenging', 'Hard', 'Foundational')),
  accent text not null default ''
);

create table if not exists public.skill_groups (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  title text not null,
  items text[] not null default '{}'
);

create table if not exists public.archive_items (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  slug text not null unique,
  title text not null,
  issuer text not null default '',
  date text not null default '',
  kind text not null default 'Certificate' check (kind in ('Transcript', 'Degree', 'Certificate')),
  logo text not null default '',
  image text,
  href text
);

do $rls$
declare t text;
begin
  foreach t in array array['site_profile','projects','personal_projects','internal_projects','skill_groups','archive_items']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin writes" on public.%I', t);
    execute format('create policy "admin writes" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $rls$;

-- Seeds (skipped when the table already has rows) -----------------------------

insert into public.site_profile (id, name, initials, age, title, subtitle, location, email, work_email, phones, address, pitch, long_pitch, stats)
values (1, $s$Pov Lyhoung$s$, $s$PL$s$, 21, $s$Software Engineer$s$, $s$Full-Stack · Mobile · AI-Augmented Builder$s$, $s$Phnom Penh, Cambodia$s$, $s$povlyhoung02@gmail.com$s$, $s$pov.lyhoung@e-power.com.kh$s$, array[$s$+855 15-357 776$s$, $s$+855 89-826 667$s$], $s$468 St, Toul Tom Pong II, Chamkar Mon, Phnom Penh$s$, $s$I'm a hands-on software engineer shipping production-grade backend, web, and mobile apps for the energy sector. I love clean systems, fast iterations, and shipping things people actually use.$s$, $s$Since December 2023 I've been part of the engineering team at E-Power CCL, working across six real-world products — Solar, EAC App, Mobile Billing, E-Power Maps, E-Power Maps Desktop, and E-Power Condo Desktop Management System — owning slices of backend, frontend, and ongoing maintenance. I learn fast, write practical code, and stay calm under deadlines.$s$, $s$[{"label":"Production projects","value":"6+"},{"label":"Years coding","value":"4+"},{"label":"Roles covered","value":"Backend · Frontend · Mobile"},{"label":"Open to","value":"Full-time · Part-time · Outsourcing"}]$s$::jsonb)
on conflict (id) do nothing;

insert into public.projects (sort_order, slug, name, tagline, description, roles, stack, logo, accent, highlights)
select * from (values
  (1, $s$solar$s$, $s$Solar Rooftop$s$, $s$End-to-end solar rooftop management platform$s$, $s$Full-stack product covering customer onboarding, site surveys, installation tracking, and post-sale operations for E-Power's solar rooftop business.$s$, array[$s$Backend$s$, $s$Frontend$s$, $s$Maintenance$s$], array[$s$Flutter$s$, $s$Dart 3$s$, $s$.NET$s$, $s$C#$s$, $s$SQL Server$s$, $s$REST API$s$], $s$/assets/projects/solar.png$s$, $s$from-amber-400 via-yellow-300 to-sky-400$s$, array[$s$Owned backend API features and database modeling$s$, $s$Built core frontend flows and dashboards$s$, $s$On-call maintenance & production hotfixes$s$]),
  (2, $s$eac$s$, $s$EAC App$s$, $s$Customer-facing app for Electricité du Cambodge$s$, $s$Customer mobile experience for Cambodia's national electricity authority — accounts, bills, notifications, and self-service tooling built with Flutter.$s$, array[$s$Frontend$s$, $s$Maintenance$s$], array[$s$Flutter$s$, $s$Dart 3$s$, $s$REST API$s$, $s$Firebase$s$], $s$/assets/projects/eac.png$s$, $s$from-sky-400 via-cyan-300 to-amber-300$s$, array[$s$Built customer-facing screens & flows$s$, $s$Integrated REST APIs and push notifications$s$, $s$Ongoing maintenance against production data$s$]),
  (3, $s$epower-maps$s$, $s$E-Power Maps$s$, $s$Field-ops geospatial platform for E-Power$s$, $s$Geospatial platform mapping power infrastructure, field assets, and operations — backend services plus a mobile client for the field team.$s$, array[$s$Backend$s$, $s$Frontend$s$, $s$Maintenance$s$], array[$s$Flutter$s$, $s$Node.js$s$, $s$PostgreSQL$s$, $s$REST API$s$, $s$Maps SDK$s$], $s$/assets/projects/maps.png$s$, $s$from-orange-400 via-amber-300 to-rose-400$s$, array[$s$Designed backend services for geo data$s$, $s$Built map-driven mobile UI in Flutter$s$, $s$Maintaining live data sync for field users$s$]),
  (4, $s$epower-maps-desktop$s$, $s$E-Power Maps Desktop$s$, $s$Desktop control panel for maps operations$s$, $s$Desktop management tool for office teams working with E-Power Maps — reviewing field assets, managing map data, and supporting daily operations from a larger-screen workflow.$s$, array[$s$Frontend$s$, $s$Maintenance$s$], array[$s$.NET Desktop$s$, $s$C#$s$, $s$SQL Server$s$, $s$REST API$s$, $s$Maps Data$s$], $s$/assets/projects/maps.png$s$, $s$from-violet-400 via-sky-300 to-cyan-300$s$, array[$s$Built desktop workflows for maps operations$s$, $s$Connected asset screens to backend services$s$, $s$Supported staff with production fixes$s$]),
  (5, $s$epower-condo-desktop$s$, $s$E-Power Condo Desktop Management System$s$, $s$Desktop system for condo operations$s$, $s$Desktop management system for condominium operations — helping teams organize customer records, utility workflows, billing support, and day-to-day administrative tasks.$s$, array[$s$Backend$s$, $s$Frontend$s$, $s$Maintenance$s$], array[$s$.NET Desktop$s$, $s$C#$s$, $s$SQL Server$s$, $s$REST API$s$, $s$Reporting$s$], $s$/assets/projects/epower.png$s$, $s$from-rose-400 via-indigo-400 to-cyan-300$s$, array[$s$Implemented management screens and service flows$s$, $s$Worked with database-backed business records$s$, $s$Maintained reliability for office users$s$]),
  (6, $s$mobile-billing$s$, $s$Mobile Billing$s$, $s$Field billing & meter-reading suite$s$, $s$Mobile billing toolkit for meter readers and field collectors — payments, receipts, and offline-friendly data capture, backed by E-Power's billing core.$s$, array[$s$Frontend$s$, $s$Maintenance$s$], array[$s$Flutter$s$, $s$.NET API$s$, $s$SQL Server$s$, $s$Offline Sync$s$], $s$/assets/projects/billing.png$s$, $s$from-emerald-400 via-teal-300 to-sky-400$s$, array[$s$Implemented field billing UI in Flutter$s$, $s$Wired up REST integrations for payments$s$, $s$Maintaining production stability$s$])
) as v(sort_order, slug, name, tagline, description, roles, stack, logo, accent, highlights)
where not exists (select 1 from public.projects);

insert into public.personal_projects (sort_order, slug, name, tagline, description, stack, logo, accent, status, highlights)
select * from (values
  (1, $s$jrms$s$, $s$JRMS$s$, $s$Job Recruitment Management System$s$, $s$Self-initiated research project — a cross-platform recruitment system pairing a Flutter client (web, mobile, desktop) with a .NET service layer. Exploring matching logic, candidate flows, and multi-tenant org structure.$s$, array[$s$Flutter$s$, $s$Dart 3$s$, $s$.NET$s$, $s$Docker$s$, $s$PostgreSQL$s$, $s$Render$s$], $s$/assets/projects/jrms.png$s$, $s$from-indigo-500 via-violet-400 to-orange-400$s$, $s$Research$s$, array[$s$Designed end-to-end recruitment data model$s$, $s$Built Flutter client targeting web + mobile + desktop$s$, $s$Containerized with Docker, deployment-ready via Render$s$]),
  (2, $s$e-commerce$s$, $s$E-Commerce Platform$s$, $s$Multi-vendor marketplace with payments & realtime$s$, $s$A multi-vendor marketplace inspired by Facebook Marketplace — personal sellers, company storefronts, staff/roles, inventory, payouts, and reporting. Trilingual (Khmer · English · Chinese), KHQR payments, WebSocket realtime.$s$, array[$s$Next.js 14$s$, $s$Fastify$s$, $s$PostgreSQL$s$, $s$Supabase Storage$s$, $s$KHQR$s$, $s$WebSocket$s$, $s$pnpm$s$], $s$/assets/projects/e-commerce.svg$s$, $s$from-cyan-400 via-indigo-400 to-amber-300$s$, $s$Active$s$, array[$s$Multi-vendor storefronts with staff + role management$s$, $s$KHQR payment flow & payout reporting$s$, $s$Trilingual i18n (KM / EN / ZH) end-to-end$s$]),
  (3, $s$ss-garage$s$, $s$SS Garage Billing$s$, $s$Self-contained invoice manager for a real garage$s$, $s$A bilingual (Khmer + English) invoice management system modeled 1:1 on a paper invoice — customer + vehicle blocks, 18-row item table, totals, cash/check note. Runs as three Docker containers with a one-command spin-up.$s$, array[$s$Next.js 14$s$, $s$Express$s$, $s$PostgreSQL 16$s$, $s$Docker Compose$s$, $s$Tailwind$s$], $s$/assets/projects/ss-garage.svg$s$, $s$from-amber-400 via-yellow-300 to-cyan-400$s$, $s$Shipped$s$, array[$s$1:1 reproduction of a hand-written paper invoice$s$, $s$Bilingual UI (Khmer + English)$s$, $s$One-command Docker Compose stack$s$]),
  (4, $s$mdms-v2$s$, $s$MDMS v2$s$, $s$Meter Data Management System — next-gen rebuild$s$, $s$A self-initiated v2 rebuild of the Meter Data Management System — rethinking meter ingestion, validation, and reporting around a modern, type-safe stack. Exploring multi-tenant data models, role-based access, and audit-friendly pipelines.$s$, array[$s$Next.js$s$, $s$.NET$s$, $s$PostgreSQL$s$, $s$Docker$s$, $s$Prisma$s$, $s$Tailwind$s$], $s$/assets/projects/mdms-v2.svg$s$, $s$from-indigo-500 via-sky-400 to-cyan-300$s$, $s$Research$s$, array[$s$Multi-tenant meter data model with role-based access$s$, $s$Validated ingestion + audit-ready pipelines$s$, $s$Type-safe API layer end-to-end$s$]),
  (5, $s$solar-v2$s$, $s$Solar v2$s$, $s$Next-gen rebuild of the solar rooftop platform$s$, $s$A personal v2 reimagining of the Solar rooftop platform I work on at E-Power — cleaner architecture, faster dashboards, and richer energy analytics. Researching real-time monitoring, forecasting, and a smoother cross-platform client.$s$, array[$s$Flutter$s$, $s$Dart 3$s$, $s$.NET$s$, $s$PostgreSQL$s$, $s$WebSocket$s$, $s$Docker$s$], $s$/assets/projects/solar.png$s$, $s$from-amber-400 via-orange-400 to-yellow-300$s$, $s$Active$s$, array[$s$Real-time monitoring & energy analytics dashboards$s$, $s$Reworked architecture for speed and maintainability$s$, $s$Cross-platform Flutter client (web + mobile)$s$]),
  (6, $s$e-water-v2$s$, $s$E-Water v2$s$, $s$Water utility metering & billing, rebuilt$s$, $s$A research rebuild of a water utility platform — metering, consumption tracking, and billing reimagined around a modern stack. Exploring offline-friendly meter reading, KHQR payments, and clearer customer billing flows.$s$, array[$s$Flutter$s$, $s$Next.js$s$, $s$.NET$s$, $s$PostgreSQL$s$, $s$KHQR$s$, $s$Docker$s$], $s$/assets/projects/e-water.svg$s$, $s$from-cyan-400 via-sky-400 to-blue-500$s$, $s$Research$s$, array[$s$Offline-friendly meter reading workflow$s$, $s$Consumption tracking + automated billing$s$, $s$KHQR payment integration$s$])
) as v(sort_order, slug, name, tagline, description, stack, logo, accent, status, highlights)
where not exists (select 1 from public.personal_projects);

insert into public.internal_projects (sort_order, slug, period, name, tagline, description, stack, difficulty, accent)
select * from (values
  (1, $s$mdms-v1$s$, $s$May 2024$s$, $s$MDMS v1$s$, $s$Meter Data Management System — first cut$s$, $s$Crafted the first version of the Meter Data Management System (MDMS) in close pair-programming sessions with ChatGPT-4.0 — an early dive into AI-augmented development workflows.$s$, array[$s$ChatGPT-4.0$s$, $s$MDMS$s$, $s$AI Pair Programming$s$], $s$Challenging$s$, $s$from-indigo-500 to-cyan-400$s$),
  (2, $s$mdms-v2$s$, $s$Jul 2024 — Feb 2025$s$, $s$MDMS v2 · DMS · Onboard v1$s$, $s$Flutter Flow foundation + Supabase + Hasura + .NET Core$s$, $s$Rebuilt MDMS as v2 on a Flutter Flow foundation, shipped a Document Management System (DMS) with backend-less Supabase integration, and delivered Onboard v1 on Flutter Flow + Hasura + .NET Core.$s$, array[$s$Flutter Flow$s$, $s$Supabase$s$, $s$Hasura$s$, $s$.NET Core$s$, $s$MDMS$s$, $s$DMS$s$, $s$Onboard$s$], $s$Hard$s$, $s$from-cyan-400 to-amber-400$s$),
  (3, $s$bill24-billflow$s$, $s$Mar 2025$s$, $s$Bill24 · BillFlow v1$s$, $s$Payment SDK integration with the Bill24 team$s$, $s$Joined the Bill24 team and integrated their payment SDK into BillFlow v1 — wiring up secure payment flows across the billing surface.$s$, array[$s$Bill24 SDK$s$, $s$Payment Integration$s$, $s$BillFlow$s$], $s$Challenging$s$, $s$from-amber-400 to-rose-400$s$),
  (4, $s$eac-bill24$s$, $s$Jun 2025$s$, $s$EAC App · Bill24 Payment$s$, $s$Embedding the Bill24 SDK inside the EAC App$s$, $s$Integrated the Bill24 payment SDK into the EAC App customer flow — letting end-users pay electricity bills directly from the app without leaving the experience.$s$, array[$s$Flutter$s$, $s$Bill24 SDK$s$, $s$Payment Integration$s$, $s$EAC App$s$], $s$Challenging$s$, $s$from-emerald-400 to-cyan-400$s$),
  (5, $s$mobile-billing-flutter$s$, $s$Aug 2025$s$, $s$Mobile Billing → Flutter$s$, $s$Kotlin single-platform → Flutter cross-platform redesign$s$, $s$Redesigned Mobile Billing from a Kotlin single-platform app into a Flutter cross-platform build — same field-billing workflows, now running on both Android and iOS from one codebase.$s$, array[$s$Flutter$s$, $s$Kotlin$s$, $s$Cross-platform Migration$s$, $s$Mobile Billing$s$], $s$Hard$s$, $s$from-sky-400 to-violet-400$s$),
  (6, $s$epower-maps-flutter$s$, $s$Feb 2026$s$, $s$E-Power Maps → Flutter (Online + Offline)$s$, $s$Kotlin → Flutter rewrite with online & offline support$s$, $s$Rebuilt E-Power Maps from Kotlin into Flutter, adding full offline support so field crews can keep working without network — local data store, sync on reconnect, and conflict handling.$s$, array[$s$Flutter$s$, $s$Kotlin$s$, $s$Offline-first$s$, $s$Local Storage$s$, $s$Sync$s$, $s$Maps SDK$s$], $s$Hard$s$, $s$from-orange-400 to-pink-400$s$),
  (7, $s$solar-keycloak$s$, $s$Apr — May 2026$s$, $s$Solar · Keycloak Migration$s$, $s$Centralized auth & full security migration to Keycloak$s$, $s$Integrated Solar with Keycloak and migrated all security across the platform onto Keycloak — single sign-on, role/realm modeling, and a unified identity layer for the company's products.$s$, array[$s$Keycloak$s$, $s$OAuth 2.0 / OIDC$s$, $s$SSO$s$, $s$Solar$s$, $s$.NET$s$, $s$Security$s$], $s$Hard$s$, $s$from-amber-400 to-indigo-500$s$),
  (8, $s$epower-maps-desktop-maintenance$s$, $s$May — Jun 2026$s$, $s$E-Power Maps Desktop · Maintenance$s$, $s$Desktop maps operations maintenance$s$, $s$Maintained E-Power Maps Desktop for office and operations teams — fixing production issues, improving workflow stability, and supporting map-data management for daily field operations.$s$, array[$s$E-Power Maps Desktop$s$, $s$.NET Desktop$s$, $s$C#$s$, $s$SQL Server$s$, $s$Maps Data$s$], $s$Challenging$s$, $s$from-sky-400 to-cyan-300$s$),
  (9, $s$epower-condo-maintenance-development$s$, $s$Jun 2026 — Present$s$, $s$E-Power Condo · Maintenance & Development$s$, $s$Condo desktop system improvements$s$, $s$Maintaining and developing E-Power Condo for condominium operations — adding features, improving data workflows, and supporting billing, customer, and administrative processes.$s$, array[$s$E-Power Condo$s$, $s$.NET Desktop$s$, $s$C#$s$, $s$SQL Server$s$, $s$Operations$s$], $s$Hard$s$, $s$from-violet-400 to-rose-400$s$),
  (10, $s$epower-condo-web-service-updater$s$, $s$Jun 2026 — Present$s$, $s$E-Power Condo Web Service Updater$s$, $s$Release updater for new E-Power Condo versions$s$, $s$Developed the web service updater used to release new E-Power Condo versions — managing version metadata, update delivery, release files, and safer rollout workflows for desktop clients.$s$, array[$s$Updater Service$s$, $s$.NET$s$, $s$C#$s$, $s$Release Management$s$, $s$Versioning$s$], $s$Hard$s$, $s$from-emerald-400 to-indigo-500$s$)
) as v(sort_order, slug, period, name, tagline, description, stack, difficulty, accent)
where not exists (select 1 from public.internal_projects);

insert into public.skill_groups (sort_order, title, items)
select * from (values
  (1, $s$Languages$s$, array[$s$C / C++$s$, $s$C#$s$, $s$Java$s$, $s$Dart 3.0$s$, $s$JavaScript$s$, $s$TypeScript$s$, $s$Python$s$, $s$Kotlin$s$, $s$Swift$s$, $s$HTML$s$, $s$CSS$s$]),
  (2, $s$Frontend & Mobile$s$, array[$s$Flutter$s$, $s$Next.js$s$, $s$React$s$, $s$Vue$s$, $s$Tailwind CSS$s$, $s$Bootstrap$s$, $s$HTML / CSS / JavaScript$s$, $s$Responsive UI$s$, $s$Mobile App Development$s$]),
  (3, $s$Backend & APIs$s$, array[$s$Node.js$s$, $s$Laravel$s$, $s$RESTful API$s$, $s$System Design$s$, $s$Backend Development$s$, $s$Web Development$s$]),
  (4, $s$Databases$s$, array[$s$SQL$s$, $s$MySQL$s$, $s$PostgreSQL$s$, $s$Database Analytics$s$]),
  (5, $s$DevOps & Cloud$s$, array[$s$Docker$s$, $s$Kubernetes$s$, $s$AWS$s$, $s$Render$s$, $s$Supabase$s$, $s$Firebase$s$, $s$Redis$s$, $s$Sentry$s$, $s$AI Ven$s$]),
  (6, $s$Tooling & Collaboration$s$, array[$s$Git$s$, $s$GitLab$s$, $s$GitHub$s$, $s$Project Management$s$, $s$Leadership$s$]),
  (7, $s$Design & AI$s$, array[$s$Figma$s$, $s$Adobe XD$s$, $s$Google Stitch$s$, $s$Claude Design$s$, $s$Claude Code$s$, $s$ChatGPT$s$, $s$Codex$s$, $s$GitHub Copilot$s$, $s$Gemini$s$, $s$DeepSeek$s$, $s$Grok$s$, $s$AI Expert Systems$s$]),
  (8, $s$Microsoft Skills$s$, array[$s$Microsoft Word$s$, $s$Microsoft Excel$s$, $s$Microsoft PowerPoint$s$, $s$Microsoft 365$s$, $s$Microsoft Teams$s$, $s$Outlook$s$, $s$OneDrive$s$, $s$SharePoint$s$, $s$Excel Formulas$s$, $s$Document Formatting$s$, $s$Presentation Design$s$])
) as v(sort_order, title, items)
where not exists (select 1 from public.skill_groups);

insert into public.archive_items (sort_order, slug, title, issuer, date, kind, logo, image, href)
select * from (values
  (1, $s$norton-transcript$s$, $s$Official Transcript of Records$s$, $s$Norton University$s$, $s$May 2026$s$, $s$Transcript$s$, $s$/assets/norton.png$s$, null, null),
  (2, $s$norton-bcs$s$, $s$Bachelor of Computer Science — Software Development$s$, $s$Norton University$s$, $s$2026$s$, $s$Degree$s$, $s$/assets/norton.png$s$, null, null),
  (3, $s$instinct-flutter$s$, $s$Flutter & Dart 3.0$s$, $s$Instinct InstiSuite$s$, $s$Jul 2024$s$, $s$Certificate$s$, $s$/assets/instinct-nobg.png$s$, null, null),
  (4, $s$etec-cpp$s$, $s$C / C++ Programming$s$, $s$ETEC Training Center$s$, $s$Nov 2023$s$, $s$Certificate$s$, $s$/assets/etec.png$s$, null, null)
) as v(sort_order, slug, title, issuer, date, kind, logo, image, href)
where not exists (select 1 from public.archive_items);
