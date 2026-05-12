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
  pitch:
    "I'm a hands-on software engineer shipping production-grade backend, web, and mobile apps for the energy sector. I love clean systems, fast iterations, and shipping things people actually use.",
  longPitch:
    "Since December 2023 I've been part of the engineering team at E-Power CCL, working across four real-world products — Solar, EAC App, Mobile Billing, and ePower Maps — owning slices of backend, frontend, and ongoing maintenance. I learn fast, write practical code, and stay calm under deadlines.",
  stats: [
    { label: "Production projects", value: "4+" },
    { label: "Years coding", value: "3+" },
    { label: "Roles covered", value: "Backend · Frontend · Mobile" },
    { label: "Open to", value: "Full-time / Outsourcing" },
  ],
};

export type EducationItem = {
  title: string;
  org: string;
  period: string;
  detail: string;
  logo: string;
};

export const education: EducationItem[] = [
  {
    title: "English Level 6 (Part-time)",
    org: "Pannasastra University of Cambodia (PUC)",
    period: "Feb 2026 — Present",
    detail:
      "Advanced English program at PUC — academic writing, professional communication, and technical reading.",
    logo: "/assets/puc-nobg.png",
  },
  {
    title: "Bachelor of Software Development",
    org: "Norton University",
    period: "2022 — 2025",
    detail:
      "Four-year program covering software engineering fundamentals, databases, networking, and project management.",
    logo: "/assets/norton.png",
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

export const experience = [
  {
    role: "Software Engineer",
    company: "E-Power CCL",
    period: "Dec 2023 — Present",
    location: "Phnom Penh",
    bullets: [
      "Backend engineer on the Solar rooftop platform and ePower Maps services — designing APIs, modeling data, and shipping features end-to-end.",
      "Frontend engineer on Solar, EAC App, ePower Maps, and Mobile Billing — building cross-platform UI with Flutter and modern web stacks.",
      "Maintaining all four products in production — fixing bugs, tuning performance, and rolling out updates against live customer data.",
      "Collaborating across backend, mobile, and ops — using GitLab, Docker, and Sentry to keep deliveries predictable.",
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
    name: "ePower Maps",
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
];

export const skillGroups = [
  {
    title: "Languages",
    items: [
      "C / C++",
      "Dart 3.0",
      "JavaScript",
      "TypeScript",
      "Python",
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
      "HTML / CSS / JavaScript",
      "Responsive UI",
      "Mobile App Development",
    ],
  },
  {
    title: "Backend & APIs",
    items: [
      "Node.js",
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
      "Gemini",
      "DeepSeek",
      "Grok",
      "AI Expert Systems",
    ],
  },
];

export const services = [
  {
    title: "Backend Engineering",
    description:
      "REST APIs, data modeling, and system design with Node.js, .NET, and SQL/PostgreSQL.",
    icon: "server",
  },
  {
    title: "Frontend & Web",
    description:
      "Modern web UIs with Next.js, React, and a deep HTML/CSS/JS foundation.",
    icon: "browser",
  },
  {
    title: "Mobile (Flutter)",
    description:
      "Cross-platform iOS & Android apps with Dart 3, REST integration, and offline flows.",
    icon: "device",
  },
  {
    title: "DevOps & Cloud",
    description:
      "Docker, Kubernetes, AWS, Render, Supabase, Firebase — shipping and keeping things up.",
    icon: "cloud",
  },
  {
    title: "AI-Augmented Builds",
    description:
      "Pairing with Claude, ChatGPT, Gemini, Codex & Grok to ship faster without losing the craft.",
    icon: "sparkles",
  },
  {
    title: "Leadership & PM",
    description:
      "Project management & team leadership for outsourcing — scoping, planning, delivering.",
    icon: "users",
  },
];
