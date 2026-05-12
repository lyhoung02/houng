export type Lang = "en" | "km";

const en = {
    nav: {
      about: "About",
      experience: "Experience",
      projects: "Projects",
      internal: "Internal",
      personal: "Personal",
      skills: "Skills",
      contact: "Contact",
      hire: "Hire Me",
      menu: "Menu",
    },
    hero: {
      availability: "Available for hire · Remote / Phnom Penh",
      greeting: "Hi, I'm",
      tagline: "an engineer who actually ships.",
      seeWork: "See my work",
      getInTouch: "Get in touch",
      buildingAt: "· currently building @ E-Power CCL",
      stats: {
        projects: "Production projects",
        years: "Years coding",
        roles: "Roles covered",
        rolesValue: "Backend · Frontend · Mobile",
        openTo: "Open to",
        openToValue: "Full-time / Outsourcing",
      },
    },
    about: {
      eyebrow: "About",
      title: "An engineer wired for shipping.",
      services: {
        backend: {
          title: "Backend Engineering",
          desc: "REST APIs, data modeling, and system design with Node.js, .NET, and SQL/PostgreSQL.",
        },
        frontend: {
          title: "Frontend & Web",
          desc: "Modern web UIs with Next.js, React, and a deep HTML/CSS/JS foundation.",
        },
        mobile: {
          title: "Mobile (Flutter)",
          desc: "Cross-platform iOS & Android apps with Dart 3, REST integration, and offline flows.",
        },
        devops: {
          title: "DevOps & Cloud",
          desc: "Docker, Kubernetes, AWS, Render, Supabase, Firebase — shipping and keeping things up.",
        },
        ai: {
          title: "AI-Augmented Builds",
          desc: "Pairing with Claude, ChatGPT, Gemini, Codex & Grok to ship faster without losing the craft.",
        },
        leadership: {
          title: "Leadership & PM",
          desc: "Project management & team leadership for outsourcing — scoping, planning, delivering.",
        },
      },
    },
    experience: {
      eyebrow: "Experience & Education",
      title: "From classroom fundamentals to production code.",
      work: "Work Experience",
      education: "Education & Training",
    },
    projects: {
      eyebrow: "Selected Work",
      title: "Real products. Real users. Live in production.",
      description:
        "Four products I helped build and keep running at E-Power CCL — covering backend, frontend, and ongoing maintenance.",
      cta: "Every product above is in production today — and I'm still maintaining all four.",
      ctaSub: "Want a deeper walkthrough or a code sample? Reach out below.",
      ctaButton: "Let's talk",
      roles: {
        Backend: "Backend",
        Frontend: "Frontend",
        Maintenance: "Maintenance",
      },
    },
    internal: {
      eyebrow: "Internal · E-Power CCL",
      title: "The hard, challenging builds behind the scenes.",
      description:
        "Internal systems, integrations, and SDK work — the kind of code customers never see, but the business runs on.",
      difficulty: {
        Challenging: "Challenging",
        Hard: "Hard",
        Foundational: "Foundational",
      },
    },
    personal: {
      eyebrow: "Personal · Research",
      title: "Side projects I build to keep sharp.",
      description:
        "Self-initiated builds and research projects — exploring product ideas, stacks, and patterns outside of day-job work.",
      status: {
        Research: "Research",
        Active: "Active",
        Shipped: "Shipped",
      },
    },
    skills: {
      eyebrow: "Skills & Toolbox",
      title: "A practical full-stack + mobile toolkit.",
      description:
        "The stack I use every day to design, build, ship, and keep things running.",
      groups: {
        Languages: "Languages",
        "Frontend & Mobile": "Frontend & Mobile",
        "Backend & APIs": "Backend & APIs",
        Databases: "Databases",
        "DevOps & Cloud": "DevOps & Cloud",
        "Tooling & Collaboration": "Tooling & Collaboration",
        "Design & AI": "Design & AI",
      },
    },
    contact: {
      eyebrow: "Let's Work",
      title: "Hire an engineer who already ships.",
      description:
        "I'm open to full-time roles, mobile/web outsourcing, and short-term builds. If you need someone who can move fast across backend, frontend, and mobile — let's talk.",
      emailMe: "Email me",
      quickFacts: "Quick Facts",
      facts: {
        name: "Name",
        age: "Age",
        location: "Location",
        role: "Role",
        status: "Status",
        statusOpen: "Open to opportunities",
        email: "Email",
        workEmail: "Work email",
        phone: "Phone",
        address: "Address",
      },
    },
    footer: {
      built: "Built with Next.js & Tailwind CSS.",
      from: "Designed & shipped from",
    },
    settings: {
      theme: "Theme",
      themeDark: "Dark",
      themeLight: "Light",
      themeSystem: "System",
      language: "Language",
      langEn: "English",
      langKm: "Khmer",
    },
};

export type Messages = typeof en;

const km: Messages = {
    nav: {
      about: "អំពីខ្ញុំ",
      experience: "បទពិសោធន៍",
      projects: "គម្រោង",
      internal: "ផ្ទៃក្នុង",
      personal: "ផ្ទាល់ខ្លួន",
      skills: "ជំនាញ",
      contact: "ទំនាក់ទំនង",
      hire: "ជួលខ្ញុំ",
      menu: "ម៉ឺនុយ",
    },
    hero: {
      availability: "ត្រៀមរួចសម្រាប់ការងារ · ពីចម្ងាយ / ភ្នំពេញ",
      greeting: "សួស្តី ខ្ញុំឈ្មោះ",
      tagline: "វិស្វករដែលផ្តោតលើការដឹកនាំផលិតផលឲ្យចេញដំណើរការ។",
      seeWork: "មើលការងាររបស់ខ្ញុំ",
      getInTouch: "ទាក់ទងមកខ្ញុំ",
      buildingAt: "· កំពុងធ្វើការនៅ E-Power CCL",
      stats: {
        projects: "គម្រោងផលិតផល",
        years: "ឆ្នាំសរសេរកូដ",
        roles: "តួនាទីដែលធ្វើ",
        rolesValue: "Backend · Frontend · Mobile",
        openTo: "បើកទទួល",
        openToValue: "ពេញម៉ោង / ដៃគូ outsourcing",
      },
    },
    about: {
      eyebrow: "អំពីខ្ញុំ",
      title: "វិស្វករដែលផ្តោតលើការដឹកនាំផលិតផលឲ្យចេញ។",
      services: {
        backend: {
          title: "Backend Engineering",
          desc: "សាងសង់ REST API, រចនាមូលដ្ឋានទិន្នន័យ និង​ប្រព័ន្ធជាមួយ Node.js, .NET, និង SQL / PostgreSQL។",
        },
        frontend: {
          title: "Frontend & Web",
          desc: "បង្កើតគេហទំព័រទំនើបជាមួយ Next.js, React និងគ្រឹះ HTML / CSS / JS ដ៏រឹងមាំ។",
        },
        mobile: {
          title: "Mobile (Flutter)",
          desc: "សាងសង់កម្មវិធី iOS និង Android ឆ្លងវេទិកាជាមួយ Dart 3, REST API និង offline flow។",
        },
        devops: {
          title: "DevOps & Cloud",
          desc: "Docker, Kubernetes, AWS, Render, Supabase, Firebase — ដឹកនាំការដាក់ឲ្យដំណើរការ និងថែទាំ។",
        },
        ai: {
          title: "បង្កើតជាមួយ AI",
          desc: "ធ្វើការគូជាមួយ Claude, ChatGPT, Gemini, Codex និង Grok ដើម្បីផលិតការងារលឿន។",
        },
        leadership: {
          title: "ដឹកនាំ & គ្រប់គ្រងគម្រោង",
          desc: "គ្រប់គ្រងគម្រោង និងដឹកនាំក្រុមសម្រាប់ outsourcing — រៀបចំ ផែនការ ប្រគល់។",
        },
      },
    },
    experience: {
      eyebrow: "បទពិសោធន៍ & ការអប់រំ",
      title: "ចាប់ពីគ្រឹះក្នុងថ្នាក់រៀន ដល់​ផលិតផលផលិតកម្ម។",
      work: "បទពិសោធន៍ការងារ",
      education: "ការអប់រំ & បណ្តុះបណ្តាល",
    },
    projects: {
      eyebrow: "ការងារបានជ្រើសរើស",
      title: "ផលិតផលពិត។ អ្នកប្រើពិត។ នៅផលិតកម្ម។",
      description:
        "ផលិតផលបួនដែលខ្ញុំជួយសាងសង់ និងថែទាំនៅ E-Power CCL — គ្របដណ្តប់ Backend, Frontend និងការថែទាំ។",
      cta: "ផលិតផលទាំងអស់ខាងលើនៅផលិតកម្ម — ហើយខ្ញុំនៅតែថែទាំទាំងបួន។",
      ctaSub: "ចង់ឃើញការពន្យល់លម្អិត ឬគំរូកូដ? ទាក់ទងខាងក្រោម។",
      ctaButton: "មកនិយាយគ្នា",
      roles: {
        Backend: "Backend",
        Frontend: "Frontend",
        Maintenance: "ការថែទាំ",
      },
    },
    internal: {
      eyebrow: "ផ្ទៃក្នុង · E-Power CCL",
      title: "ការងារពិបាក និងប្រឈមនៅពីក្រោយឆាក។",
      description:
        "ប្រព័ន្ធផ្ទៃក្នុង ការផ្សំ និង SDK — កូដដែលអ្នកប្រើមិនឃើញ ប៉ុន្តែអាជីវកម្មពឹងលើ។",
      difficulty: {
        Challenging: "ប្រឈម",
        Hard: "ពិបាក",
        Foundational: "មូលដ្ឋាន",
      },
    },
    personal: {
      eyebrow: "ផ្ទាល់ខ្លួន · ការស្រាវជ្រាវ",
      title: "គម្រោងផ្ទាល់ខ្លួនដើម្បីរក្សាជំនាញ។",
      description:
        "គម្រោងផ្តើមដោយខ្លួនឯង និងការស្រាវជ្រាវ — ស្វែងយល់គំនិតផលិតផល, stack និង pattern ក្រៅពីការងារប្រចាំថ្ងៃ។",
      status: {
        Research: "ស្រាវជ្រាវ",
        Active: "កំពុងធ្វើ",
        Shipped: "ដាក់ឲ្យដំណើរការ",
      },
    },
    skills: {
      eyebrow: "ជំនាញ & ឧបករណ៍",
      title: "ឧបករណ៍ full-stack និង mobile សម្រាប់ការប្រើពិត។",
      description:
        "Stack ដែលខ្ញុំប្រើជារៀងរាល់ថ្ងៃ ដើម្បីរចនា សាងសង់ ប្រគល់ និងថែទាំ។",
      groups: {
        Languages: "ភាសាសរសេរកម្មវិធី",
        "Frontend & Mobile": "Frontend & Mobile",
        "Backend & APIs": "Backend & API",
        Databases: "មូលដ្ឋានទិន្នន័យ",
        "DevOps & Cloud": "DevOps & Cloud",
        "Tooling & Collaboration": "ឧបករណ៍ & សហការ",
        "Design & AI": "រចនា & AI",
      },
    },
    contact: {
      eyebrow: "មកធ្វើការជាមួយគ្នា",
      title: "ជួលវិស្វករដែលដឹកនាំផលិតផលចេញ។",
      description:
        "ខ្ញុំបើកសម្រាប់ការងារពេញម៉ោង, outsourcing mobile / web, និងគម្រោងខ្លី។ បើអ្នកត្រូវការអ្នករហ័សពេញ Backend, Frontend និង Mobile — សូមនិយាយគ្នា។",
      emailMe: "ផ្ញើអ៊ីមែល",
      quickFacts: "ព័ត៌មានសង្ខេប",
      facts: {
        name: "ឈ្មោះ",
        age: "អាយុ",
        location: "ទីតាំង",
        role: "តួនាទី",
        status: "ស្ថានភាព",
        statusOpen: "បើកសម្រាប់ឱកាស",
        email: "អ៊ីមែល",
        workEmail: "អ៊ីមែលការងារ",
        phone: "លេខទូរសព្ទ",
        address: "អាសយដ្ឋាន",
      },
    },
    footer: {
      built: "សាងសង់ជាមួយ Next.js & Tailwind CSS។",
      from: "រចនា & ប្រគល់ពី",
    },
    settings: {
      theme: "របៀប",
      themeDark: "ងងឹត",
      themeLight: "ភ្លឺ",
      themeSystem: "តាមប្រព័ន្ធ",
      language: "ភាសា",
      langEn: "English",
      langKm: "ខ្មែរ",
    },
};

export const messages: Record<Lang, Messages> = { en, km };
