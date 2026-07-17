export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  roles: ("Backend" | "Frontend" | "Maintenance")[];
  stack: string[];
  logo: string;
  accent: string;
  highlights: string[];
};

export const profile = {
  name: "Pov Lyhoung",
  initials: "PL",
  age: 21,
  title: "Software Engineer",
  subtitle: "Full-Stack · Mobile · AI-Augmented Builder",
  location: "Phnom Penh, Cambodia",
  email: "povlyhoung02@gmail.com",
  workEmail: "pov.lyhoung@e-power.com.kh",
  phones: ["+855 15-357 776", "+855 89-826 667"],
  address: "468 St, Toul Tom Pong II, Chamkar Mon, Phnom Penh",
  pitch:
    "I'm a hands-on software engineer shipping production-grade backend, web, and mobile apps for the energy sector. I love clean systems, fast iterations, and shipping things people actually use.",
  longPitch:
    "Since December 2023 I've been part of the engineering team at E-Power CCL, working across six real-world products — Solar, EAC App, Mobile Billing, E-Power Maps, E-Power Maps Desktop, and E-Power Condo Desktop Management System — owning slices of backend, frontend, and ongoing maintenance. I learn fast, write practical code, and stay calm under deadlines.",
  stats: [
    { label: "Production projects", value: "6+" },
    { label: "Years coding", value: "4+" },
    { label: "Roles covered", value: "Backend · Frontend · Mobile" },
    { label: "Open to", value: "Full-time · Part-time · Outsourcing" },
  ],
};

export type EducationItem = {
  title: string;
  org: string;
  period: string;
  detail: string;
  logo: string;
  major?: string;
  result?: string;
  courses?: string[];
};

export const education: EducationItem[] = [
  {
    title: "Master of Science in Information Technology",
    org: "Norton University",
    period: "Oct 2026 - Present",
    detail:
      "Graduate program advancing software engineering, distributed systems, and applied research — building on the Bachelor program at Norton.",
    logo: "/assets/norton.png",
  },
  {
    title: "English Level 8 (Part-time)",
    org: "Pannasastra University of Cambodia (PUC)",
    period: "Feb 2026 — Present",
    detail:
      "Advanced English program at PUC — academic writing, professional communication, and technical reading.",
    logo: "/assets/puc-nobg.png",
  },
  {
    title: "Bachelor of Computer Science",
    org: "Norton University",
    period: "Mar 2022 — May 2026",
    major: "Major: Software Development · College of Science",
    result: "Final result: Pass · Total average 75.22",
    detail:
      "Four-year program spanning software engineering, data structures and algorithms, databases, networking, AI, big data, and mobile and web development — capped with a research study and thesis.",
    logo: "/assets/norton.png",
    courses: [
      "Computing Fundamentals",
      "Mathematics for Computer Science I & II",
      "Programming Methodology in C/C++",
      "Object-Oriented Modeling & Programming",
      "Data Structures and Algorithms",
      "Java Programming I",
      "Advanced Java Programming",
      "Advanced Application Development (OOP & Mobile Applied)",
      "Mobile Apps Development",
      "Advanced Mobile Apps Development",
      "Web Development",
      "Advanced Web Development",
      "UX/UI Design",
      "Digital Design",
      "Digital Image Processing",
      "Database Administration",
      "Introduction to Networks",
      "System Analysis and Design",
      "Software Engineering",
      "Software Security Technology",
      "Introduction to Artificial Intelligence (AI)",
      "AI Expert System Development",
      "Introduction to Big Data",
      "Big Data Analysis",
      "Business Intelligence",
      "Management Information System (MIS)",
      "Introduction to Internet of Things (IoT)",
      "Methods of Research and Thesis Writing",
      "Core English 1A & 1B",
      "Core English and Writing II",
      "Human and Society",
      "Khmer Studies",
      "Principles of Business",
      "Principles of Economics",
    ],
  },
  {
    title: "Flutter & Dart 3.0 (Part-time)",
    org: "Instinct InstiSuite",
    period: "Feb — Jul 2024",
    detail:
      "Cross-platform mobile development with Dart 3.0, state management, REST integration, and production deployment.",
    logo: "/assets/instinct-nobg.png",
  },
  {
    title: "C / C++ Programming (Part-time)",
    org: "ETEC Training Center",
    period: "Jul — Nov 2023",
    detail:
      "Memory model, pointers, data structures, and systems-level problem solving with C and C++.",
    logo: "/assets/etec.png",
  },
];

export type ArchiveItem = {
  slug: string;
  title: string;
  issuer: string;
  date: string;
  kind: "Transcript" | "Degree" | "Certificate";
  logo: string;
  /** Full scan/photo of the credential, if available — drop into /public/assets/archive/ */
  image?: string;
  /** Optional external verification or view link */
  href?: string;
};

export const archive: ArchiveItem[] = [
  {
    slug: "norton-transcript",
    title: "Official Transcript of Records",
    issuer: "Norton University",
    date: "May 2026",
    kind: "Transcript",
    logo: "/assets/norton.png",
  },
  {
    slug: "norton-bcs",
    title: "Bachelor of Computer Science — Software Development",
    issuer: "Norton University",
    date: "2026",
    kind: "Degree",
    logo: "/assets/norton.png",
  },
  {
    slug: "instinct-flutter",
    title: "Flutter & Dart 3.0",
    issuer: "Instinct InstiSuite",
    date: "Jul 2024",
    kind: "Certificate",
    logo: "/assets/instinct-nobg.png",
  },
  {
    slug: "etec-cpp",
    title: "C / C++ Programming",
    issuer: "ETEC Training Center",
    date: "Nov 2023",
    kind: "Certificate",
    logo: "/assets/etec.png",
  },
];

export type ExperienceItem = {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
  logo: string;
  logoMode: "image" | "wordmark";
};

export const experience: ExperienceItem[] = [
  {
    role: "Software Engineer",
    company: "E-Power CCL",
    period: "Dec 2026 — Present",
    location: "Phnom Penh",
    logo: "/assets/projects/epower.png",
    logoMode: "wordmark",
    bullets: [
      "Applying production experience from E-Power projects with the Bachelor of Computer Science foundation from Norton University.",
      "Designing maintainable software across backend, web, and mobile systems with stronger ownership of architecture and delivery quality.",
      "Continuing to grow through the Master of Science in Information Technology while building reliable customer-facing products.",
    ],
  },
  {
    role: "Full-stack Developer",
    company: "E-Power CCL",
    period: "Dec 2025 — Dec 2026",
    location: "Phnom Penh",
    logo: "/assets/projects/epower.png",
    logoMode: "wordmark",
    bullets: [
      "Built end-to-end features across Solar, EAC App, E-Power Maps, and Mobile Billing using Flutter, Next.js, .NET, and SQL-backed APIs.",
      "Connected frontend flows to backend services, modeled data, integrated REST APIs, and supported production releases.",
      "Improved product reliability through bug fixes, performance tuning, and maintenance against live customer data.",
    ],
  },
  {
    role: "Junior Developer",
    company: "E-Power CCL",
    period: "Dec 2023 — Dec 2025",
    location: "Phnom Penh",
    logo: "/assets/projects/epower.png",
    logoMode: "wordmark",
    bullets: [
      "Started as a junior developer while studying Computer Science, turning coursework in programming, databases, and software engineering into real product work.",
      "Supported Flutter mobile screens, web UI, API integration, and testing for internal and customer-facing E-Power products.",
      "Learned production workflows with GitLab, Docker, debugging, code review, and cross-team collaboration.",
    ],
  },
  {
    role: "Developer (Freelance)",
    company: "Max Freelance Team",
    period: "Jun — Dec 2025",
    location: "Remote · Phnom Penh",
    logo: "/assets/work/max-freelance.svg",
    logoMode: "image",
    bullets: [
      "Joined Max's freelance team to build a House IoT product — smart-home device control, telemetry, and a companion mobile experience.",
      "Worked on the developer side end-to-end: device integration, data pipelines from sensors, and feature flows in the app.",
      "Coordinated with a distributed freelance team on delivery cadence, code reviews, and shared environments.",
    ],
  },
  {
    role: "UX / UI Designer (Freelance)",
    company: "Freelance Team · RUPP Students",
    period: "Feb — Apr 2024",
    location: "Phnom Penh",
    logo: "/assets/work/rupp-design.svg",
    logoMode: "image",
    bullets: [
      "Joined a freelance team of RUPP (Royal University of Phnom Penh) students to design an Online Coffee Shop website.",
      "Led UX flows and high-fidelity UI: home, menu, product detail, cart, and checkout — including responsive behavior.",
      "Produced design specs and handed off assets to the engineering side of the team.",
    ],
  },
];

export const projects: Project[] = [
  {
    slug: "solar",
    name: "Solar Rooftop",
    tagline: "End-to-end solar rooftop management platform",
    description:
      "Full-stack product covering customer onboarding, site surveys, installation tracking, and post-sale operations for E-Power's solar rooftop business.",
    roles: ["Backend", "Frontend", "Maintenance"],
    stack: ["Flutter", "Dart 3", ".NET", "C#", "SQL Server", "REST API"],
    logo: "/assets/projects/solar.png",
    accent: "from-amber-400 via-yellow-300 to-sky-400",
    highlights: [
      "Owned backend API features and database modeling",
      "Built core frontend flows and dashboards",
      "On-call maintenance & production hotfixes",
    ],
  },
  {
    slug: "eac",
    name: "EAC App",
    tagline: "Customer-facing app for Electricité du Cambodge",
    description:
      "Customer mobile experience for Cambodia's national electricity authority — accounts, bills, notifications, and self-service tooling built with Flutter.",
    roles: ["Frontend", "Maintenance"],
    stack: ["Flutter", "Dart 3", "REST API", "Firebase"],
    logo: "/assets/projects/eac.png",
    accent: "from-sky-400 via-cyan-300 to-amber-300",
    highlights: [
      "Built customer-facing screens & flows",
      "Integrated REST APIs and push notifications",
      "Ongoing maintenance against production data",
    ],
  },
  {
    slug: "epower-maps",
    name: "E-Power Maps",
    tagline: "Field-ops geospatial platform for E-Power",
    description:
      "Geospatial platform mapping power infrastructure, field assets, and operations — backend services plus a mobile client for the field team.",
    roles: ["Backend", "Frontend", "Maintenance"],
    stack: ["Flutter", "Node.js", "PostgreSQL", "REST API", "Maps SDK"],
    logo: "/assets/projects/maps.png",
    accent: "from-orange-400 via-amber-300 to-rose-400",
    highlights: [
      "Designed backend services for geo data",
      "Built map-driven mobile UI in Flutter",
      "Maintaining live data sync for field users",
    ],
  },
  {
    slug: "epower-maps-desktop",
    name: "E-Power Maps Desktop",
    tagline: "Desktop control panel for maps operations",
    description:
      "Desktop management tool for office teams working with E-Power Maps — reviewing field assets, managing map data, and supporting daily operations from a larger-screen workflow.",
    roles: ["Frontend", "Maintenance"],
    stack: [".NET Desktop", "C#", "SQL Server", "REST API", "Maps Data"],
    logo: "/assets/projects/maps.png",
    accent: "from-violet-400 via-sky-300 to-cyan-300",
    highlights: [
      "Built desktop workflows for maps operations",
      "Connected asset screens to backend services",
      "Supported staff with production fixes",
    ],
  },
  {
    slug: "epower-condo-desktop",
    name: "E-Power Condo Desktop Management System",
    tagline: "Desktop system for condo operations",
    description:
      "Desktop management system for condominium operations — helping teams organize customer records, utility workflows, billing support, and day-to-day administrative tasks.",
    roles: ["Backend", "Frontend", "Maintenance"],
    stack: [".NET Desktop", "C#", "SQL Server", "REST API", "Reporting"],
    logo: "/assets/projects/epower.png",
    accent: "from-rose-400 via-indigo-400 to-cyan-300",
    highlights: [
      "Implemented management screens and service flows",
      "Worked with database-backed business records",
      "Maintained reliability for office users",
    ],
  },
  {
    slug: "mobile-billing",
    name: "Mobile Billing",
    tagline: "Field billing & meter-reading suite",
    description:
      "Mobile billing toolkit for meter readers and field collectors — payments, receipts, and offline-friendly data capture, backed by E-Power's billing core.",
    roles: ["Frontend", "Maintenance"],
    stack: ["Flutter", ".NET API", "SQL Server", "Offline Sync"],
    logo: "/assets/projects/billing.png",
    accent: "from-emerald-400 via-teal-300 to-sky-400",
    highlights: [
      "Implemented field billing UI in Flutter",
      "Wired up REST integrations for payments",
      "Maintaining production stability",
    ],
  },
];

export type PersonalProject = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  logo: string;
  accent: string;
  status: "Research" | "Active" | "Shipped";
  highlights: string[];
};

export const personalProjects: PersonalProject[] = [
  {
    slug: "jrms",
    name: "JRMS",
    tagline: "Job Recruitment Management System",
    description:
      "Self-initiated research project — a cross-platform recruitment system pairing a Flutter client (web, mobile, desktop) with a .NET service layer. Exploring matching logic, candidate flows, and multi-tenant org structure.",
    stack: ["Flutter", "Dart 3", ".NET", "Docker", "PostgreSQL", "Render"],
    logo: "/assets/projects/jrms.png",
    accent: "from-indigo-500 via-violet-400 to-orange-400",
    status: "Research",
    highlights: [
      "Designed end-to-end recruitment data model",
      "Built Flutter client targeting web + mobile + desktop",
      "Containerized with Docker, deployment-ready via Render",
    ],
  },
  {
    slug: "e-commerce",
    name: "E-Commerce Platform",
    tagline: "Multi-vendor marketplace with payments & realtime",
    description:
      "A multi-vendor marketplace inspired by Facebook Marketplace — personal sellers, company storefronts, staff/roles, inventory, payouts, and reporting. Trilingual (Khmer · English · Chinese), KHQR payments, WebSocket realtime.",
    stack: [
      "Next.js 14",
      "Fastify",
      "PostgreSQL",
      "Supabase Storage",
      "KHQR",
      "WebSocket",
      "pnpm",
    ],
    logo: "/assets/projects/e-commerce.svg",
    accent: "from-cyan-400 via-indigo-400 to-amber-300",
    status: "Active",
    highlights: [
      "Multi-vendor storefronts with staff + role management",
      "KHQR payment flow & payout reporting",
      "Trilingual i18n (KM / EN / ZH) end-to-end",
    ],
  },
  {
    slug: "ss-garage",
    name: "SS Garage Billing",
    tagline: "Self-contained invoice manager for a real garage",
    description:
      "A bilingual (Khmer + English) invoice management system modeled 1:1 on a paper invoice — customer + vehicle blocks, 18-row item table, totals, cash/check note. Runs as three Docker containers with a one-command spin-up.",
    stack: ["Next.js 14", "Express", "PostgreSQL 16", "Docker Compose", "Tailwind"],
    logo: "/assets/projects/ss-garage.svg",
    accent: "from-amber-400 via-yellow-300 to-cyan-400",
    status: "Shipped",
    highlights: [
      "1:1 reproduction of a hand-written paper invoice",
      "Bilingual UI (Khmer + English)",
      "One-command Docker Compose stack",
    ],
  },
  {
    slug: "mdms-v2",
    name: "MDMS v2",
    tagline: "Meter Data Management System — next-gen rebuild",
    description:
      "A self-initiated v2 rebuild of the Meter Data Management System — rethinking meter ingestion, validation, and reporting around a modern, type-safe stack. Exploring multi-tenant data models, role-based access, and audit-friendly pipelines.",
    stack: ["Next.js", ".NET", "PostgreSQL", "Docker", "Prisma", "Tailwind"],
    logo: "/assets/projects/mdms-v2.svg",
    accent: "from-indigo-500 via-sky-400 to-cyan-300",
    status: "Research",
    highlights: [
      "Multi-tenant meter data model with role-based access",
      "Validated ingestion + audit-ready pipelines",
      "Type-safe API layer end-to-end",
    ],
  },
  {
    slug: "solar-v2",
    name: "Solar v2",
    tagline: "Next-gen rebuild of the solar rooftop platform",
    description:
      "A personal v2 reimagining of the Solar rooftop platform I work on at E-Power — cleaner architecture, faster dashboards, and richer energy analytics. Researching real-time monitoring, forecasting, and a smoother cross-platform client.",
    stack: ["Flutter", "Dart 3", ".NET", "PostgreSQL", "WebSocket", "Docker"],
    logo: "/assets/projects/solar.png",
    accent: "from-amber-400 via-orange-400 to-yellow-300",
    status: "Active",
    highlights: [
      "Real-time monitoring & energy analytics dashboards",
      "Reworked architecture for speed and maintainability",
      "Cross-platform Flutter client (web + mobile)",
    ],
  },
  {
    slug: "e-water-v2",
    name: "E-Water v2",
    tagline: "Water utility metering & billing, rebuilt",
    description:
      "A research rebuild of a water utility platform — metering, consumption tracking, and billing reimagined around a modern stack. Exploring offline-friendly meter reading, KHQR payments, and clearer customer billing flows.",
    stack: ["Flutter", "Next.js", ".NET", "PostgreSQL", "KHQR", "Docker"],
    logo: "/assets/projects/e-water.svg",
    accent: "from-cyan-400 via-sky-400 to-blue-500",
    status: "Research",
    highlights: [
      "Offline-friendly meter reading workflow",
      "Consumption tracking + automated billing",
      "KHQR payment integration",
    ],
  },
];

export type InternalProject = {
  slug: string;
  period: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  difficulty: "Challenging" | "Hard" | "Foundational";
  accent: string;
};

export const internalProjects: InternalProject[] = [
  {
    slug: "mdms-v1",
    period: "May 2024",
    name: "MDMS v1",
    tagline: "Meter Data Management System — first cut",
    description:
      "Crafted the first version of the Meter Data Management System (MDMS) in close pair-programming sessions with ChatGPT-4.0 — an early dive into AI-augmented development workflows.",
    stack: ["ChatGPT-4.0", "MDMS", "AI Pair Programming"],
    difficulty: "Challenging",
    accent: "from-indigo-500 to-cyan-400",
  },
  {
    slug: "mdms-v2",
    period: "Jul 2024 — Feb 2025",
    name: "MDMS v2 · DMS · Onboard v1",
    tagline: "Flutter Flow foundation + Supabase + Hasura + .NET Core",
    description:
      "Rebuilt MDMS as v2 on a Flutter Flow foundation, shipped a Document Management System (DMS) with backend-less Supabase integration, and delivered Onboard v1 on Flutter Flow + Hasura + .NET Core.",
    stack: [
      "Flutter Flow",
      "Supabase",
      "Hasura",
      ".NET Core",
      "MDMS",
      "DMS",
      "Onboard",
    ],
    difficulty: "Hard",
    accent: "from-cyan-400 to-amber-400",
  },
  {
    slug: "bill24-billflow",
    period: "Mar 2025",
    name: "Bill24 · BillFlow v1",
    tagline: "Payment SDK integration with the Bill24 team",
    description:
      "Joined the Bill24 team and integrated their payment SDK into BillFlow v1 — wiring up secure payment flows across the billing surface.",
    stack: ["Bill24 SDK", "Payment Integration", "BillFlow"],
    difficulty: "Challenging",
    accent: "from-amber-400 to-rose-400",
  },
  {
    slug: "eac-bill24",
    period: "Jun 2025",
    name: "EAC App · Bill24 Payment",
    tagline: "Embedding the Bill24 SDK inside the EAC App",
    description:
      "Integrated the Bill24 payment SDK into the EAC App customer flow — letting end-users pay electricity bills directly from the app without leaving the experience.",
    stack: ["Flutter", "Bill24 SDK", "Payment Integration", "EAC App"],
    difficulty: "Challenging",
    accent: "from-emerald-400 to-cyan-400",
  },
  {
    slug: "mobile-billing-flutter",
    period: "Aug 2025",
    name: "Mobile Billing → Flutter",
    tagline: "Kotlin single-platform → Flutter cross-platform redesign",
    description:
      "Redesigned Mobile Billing from a Kotlin single-platform app into a Flutter cross-platform build — same field-billing workflows, now running on both Android and iOS from one codebase.",
    stack: ["Flutter", "Kotlin", "Cross-platform Migration", "Mobile Billing"],
    difficulty: "Hard",
    accent: "from-sky-400 to-violet-400",
  },
  {
    slug: "epower-maps-flutter",
    period: "Feb 2026",
    name: "E-Power Maps → Flutter (Online + Offline)",
    tagline: "Kotlin → Flutter rewrite with online & offline support",
    description:
      "Rebuilt E-Power Maps from Kotlin into Flutter, adding full offline support so field crews can keep working without network — local data store, sync on reconnect, and conflict handling.",
    stack: [
      "Flutter",
      "Kotlin",
      "Offline-first",
      "Local Storage",
      "Sync",
      "Maps SDK",
    ],
    difficulty: "Hard",
    accent: "from-orange-400 to-pink-400",
  },
  {
    slug: "solar-keycloak",
    period: "Apr — May 2026",
    name: "Solar · Keycloak Migration",
    tagline: "Centralized auth & full security migration to Keycloak",
    description:
      "Integrated Solar with Keycloak and migrated all security across the platform onto Keycloak — single sign-on, role/realm modeling, and a unified identity layer for the company's products.",
    stack: ["Keycloak", "OAuth 2.0 / OIDC", "SSO", "Solar", ".NET", "Security"],
    difficulty: "Hard",
    accent: "from-amber-400 to-indigo-500",
  },
  {
    slug: "epower-maps-desktop-maintenance",
    period: "May — Jun 2026",
    name: "E-Power Maps Desktop · Maintenance",
    tagline: "Desktop maps operations maintenance",
    description:
      "Maintained E-Power Maps Desktop for office and operations teams — fixing production issues, improving workflow stability, and supporting map-data management for daily field operations.",
    stack: ["E-Power Maps Desktop", ".NET Desktop", "C#", "SQL Server", "Maps Data"],
    difficulty: "Challenging",
    accent: "from-sky-400 to-cyan-300",
  },
  {
    slug: "epower-condo-maintenance-development",
    period: "Jun 2026 — Present",
    name: "E-Power Condo · Maintenance & Development",
    tagline: "Condo desktop system improvements",
    description:
      "Maintaining and developing E-Power Condo for condominium operations — adding features, improving data workflows, and supporting billing, customer, and administrative processes.",
    stack: ["E-Power Condo", ".NET Desktop", "C#", "SQL Server", "Operations"],
    difficulty: "Hard",
    accent: "from-violet-400 to-rose-400",
  },
  {
    slug: "epower-condo-web-service-updater",
    period: "Jun 2026 — Present",
    name: "E-Power Condo Web Service Updater",
    tagline: "Release updater for new E-Power Condo versions",
    description:
      "Developed the web service updater used to release new E-Power Condo versions — managing version metadata, update delivery, release files, and safer rollout workflows for desktop clients.",
    stack: ["Updater Service", ".NET", "C#", "Release Management", "Versioning"],
    difficulty: "Hard",
    accent: "from-emerald-400 to-indigo-500",
  },
];

export const skillGroups = [
  {
    title: "Languages",
    items: [
      "C / C++",
      "C#",
      "Java",
      "Dart 3.0",
      "JavaScript",
      "TypeScript",
      "Python",
      "Kotlin",
      "Swift",
      "HTML",
      "CSS",
    ],
  },
  {
    title: "Frontend & Mobile",
    items: [
      "Flutter",
      "Next.js",
      "React",
      "Vue",
      "Tailwind CSS",
      "Bootstrap",
      "HTML / CSS / JavaScript",
      "Responsive UI",
      "Mobile App Development",
    ],
  },
  {
    title: "Backend & APIs",
    items: [
      "Node.js",
      "Laravel",
      "RESTful API",
      "System Design",
      "Backend Development",
      "Web Development",
    ],
  },
  {
    title: "Databases",
    items: ["SQL", "MySQL", "PostgreSQL", "Database Analytics"],
  },
  {
    title: "DevOps & Cloud",
    items: [
      "Docker",
      "Kubernetes",
      "AWS",
      "Render",
      "Supabase",
      "Firebase",
      "Redis",
      "Sentry",
      "AI Ven",
    ],
  },
  {
    title: "Tooling & Collaboration",
    items: ["Git", "GitLab", "GitHub", "Project Management", "Leadership"],
  },
  {
    title: "Design & AI",
    items: [
      "Figma",
      "Adobe XD",
      "Google Stitch",
      "Claude Design",
      "Claude Code",
      "ChatGPT",
      "Codex",
      "GitHub Copilot",
      "Gemini",
      "DeepSeek",
      "Grok",
      "AI Expert Systems",
    ],
  },
  {
    title: "Microsoft Skills",
    items: [
      "Microsoft Word",
      "Microsoft Excel",
      "Microsoft PowerPoint",
      "Microsoft 365",
      "Microsoft Teams",
      "Outlook",
      "OneDrive",
      "SharePoint",
      "Excel Formulas",
      "Document Formatting",
      "Presentation Design",
    ],
  },
];
