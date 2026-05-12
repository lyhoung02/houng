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
      resume: "Resume",
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
        openToValue: "Full-time · Part-time · Outsourcing",
      },
    },
    about: {
      eyebrow: "About",
      title: "An engineer wired for shipping.",
      workStyle: {
        title: "How I work with teams",
        intro:
          "I'm easygoing, friendly, and respectful — a hard-working, active teammate and a leader who resolves problems with the best possible solution.",
        traits: [
          "Easygoing",
          "Friendly",
          "Hard-working",
          "Active",
          "Respectful",
          "Open-minded",
          "Problem-solver",
          "Team Leader",
        ],
      },
      aiMindset: {
        title: "Built for the AI era",
        description:
          "Flexible between hands-on coding and AI-augmented generation — sharpening prompt craft, exploring creative ideas, and proposing directions for the next generation of builds.",
      },
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
        "Internal systems, integrations, and SDK work — the kind of code customers never see, but that the business depends on.",
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
        "Self-initiated builds and research projects — exploring product ideas, stacks, and patterns outside the day job.",
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
    resume: {
      title: "Résumé",
      backToPortfolio: "Back to portfolio",
      download: "Download / Print",
      summary: "Summary",
      experience: "Experience",
      education: "Education & Training",
      selectedProjects: "Selected Projects",
      internalProjects: "Internal Projects · E-Power CCL",
      personalProjects: "Personal & Research Projects",
      skills: "Skills",
      contact: "Contact",
      printedFrom: "Printed from houng.pages.dev",
    },
    chat: {
      open: "Chat with me",
      close: "Close chat",
      title: "Pov Lyhoung",
      subtitle: "Usually replies in a few hours",
      status: "Online",
      placeholder: "Type a message…",
      send: "Send",
      demoNote: "Demo chat · sample replies until backend is connected",
      typing: "typing…",
      welcome:
        "Hey 👋 thanks for stopping by! I'm Lyhoung. Ask me anything — about my projects, stack, or hiring me.",
      suggestions: ["Are you available for hire?", "Show me your projects", "What's your stack?"],
      replies: {
        greeting:
          "Hey! Thanks for saying hi. What brings you here today — looking to hire, or just curious about my work?",
        hire:
          "Yes — I'm open to full-time roles and outsourcing. Drop me an email at povlyhoung02@gmail.com or scroll down to the Contact section.",
        projects:
          "I'm shipping four products at E-Power CCL — Solar, EAC App, ePower Maps, Mobile Billing. Side projects: JRMS, E-Commerce, SS Garage. See the Projects section above 👆",
        stack:
          "Mostly Flutter, Next.js, Node.js, .NET, PostgreSQL, Docker. Full list in the Skills section.",
        phone:
          "Sure — call or message me at +855 15-357 776 or +855 89-826 667.",
        resume:
          "You can see my full résumé at /resume — it's printable as a PDF too.",
        email:
          "Public: povlyhoung02@gmail.com · Work: pov.lyhoung@e-power.com.kh",
        thanks: "Anytime! Let me know if you want a deeper dive on anything.",
        default:
          "Thanks for the message — I'll get back to you ASAP. Meanwhile feel free to email povlyhoung02@gmail.com.",
      },
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
      resume: "ប្រវត្តិរូប",
      hire: "ជួលខ្ញុំ",
      menu: "ម៉ឺនុយ",
    },
    hero: {
      availability: "បើកទទួលការងារ · ពីចម្ងាយ / ភ្នំពេញ",
      greeting: "សួស្តី ខ្ញុំឈ្មោះ",
      tagline: "វិស្វករដែលដឹកនាំការងារឲ្យចេញដំណើរការមែនទែន។",
      seeWork: "មើលការងាររបស់ខ្ញុំ",
      getInTouch: "ទាក់ទងមកខ្ញុំ",
      buildingAt: "· កំពុងធ្វើការនៅ E-Power CCL",
      stats: {
        projects: "គម្រោងផលិតផល",
        years: "ឆ្នាំសរសេរកូដ",
        roles: "តួនាទីដែលបានធ្វើ",
        rolesValue: "Backend · Frontend · Mobile",
        openTo: "បើកទទួល",
        openToValue: "ពេញម៉ោង · ក្រៅម៉ោង · Outsourcing",
      },
    },
    about: {
      eyebrow: "អំពីខ្ញុំ",
      title: "វិស្វករដែលដឹកនាំការងារឲ្យចេញដំណើរការ។",
      workStyle: {
        title: "របៀបដែលខ្ញុំធ្វើការជាមួយក្រុម",
        intro:
          "ខ្ញុំជាមនុស្សងាយស្រួល រួសរាយ និងគោរពអ្នកដទៃ — ជាសមាជិកក្រុមដែលឧស្សាហ៍ សកម្ម និងជាមេក្រុមដែលដោះស្រាយបញ្ហាជាមួយដំណោះស្រាយល្អបំផុត។",
        traits: [
          "ងាយស្រួល",
          "រួសរាយ",
          "ឧស្សាហ៍",
          "សកម្ម",
          "គោរពអ្នកដទៃ",
          "ចិត្តទូលាយ",
          "ដោះស្រាយបញ្ហា",
          "មេក្រុម",
        ],
      },
      aiMindset: {
        title: "ត្រៀមសម្រាប់យុគ AI",
        description:
          "សម្របខ្លួនបានរវាងការសរសេរកូដដោយដៃ និងការប្រើ AI — អភិវឌ្ឍសិល្បៈ Prompt, ស្វែងយល់គំនិតច្នៃប្រឌិត, និងស្នើទិសដៅសម្រាប់ការងារជំនាន់ក្រោយ។",
      },
      services: {
        backend: {
          title: "Backend Engineering",
          desc: "បង្កើត REST API, រចនាមូលដ្ឋានទិន្នន័យ និងប្រព័ន្ធជាមួយ Node.js, .NET, និង SQL / PostgreSQL។",
        },
        frontend: {
          title: "Frontend & Web",
          desc: "បង្កើតគេហទំព័រទំនើបជាមួយ Next.js, React និងគ្រឹះ HTML / CSS / JS ដ៏រឹងមាំ។",
        },
        mobile: {
          title: "Mobile (Flutter)",
          desc: "បង្កើតកម្មវិធី iOS និង Android cross-platform ជាមួយ Dart 3, REST API និង offline flow។",
        },
        devops: {
          title: "DevOps & Cloud",
          desc: "Docker, Kubernetes, AWS, Render, Supabase, Firebase — ការដាក់ឲ្យដំណើរការ និងថែទាំ។",
        },
        ai: {
          title: "បង្កើតជាមួយ AI",
          desc: "ធ្វើការជាគូជាមួយ Claude, ChatGPT, Gemini, Codex និង Grok ដើម្បីផលិតការងារកាន់តែលឿន។",
        },
        leadership: {
          title: "ដឹកនាំ & គ្រប់គ្រងគម្រោង",
          desc: "គ្រប់គ្រងគម្រោង និងដឹកនាំក្រុមសម្រាប់ Outsourcing — កំណត់វិសាលភាព ផែនការ និងប្រគល់ការងារ។",
        },
      },
    },
    experience: {
      eyebrow: "បទពិសោធន៍ & ការអប់រំ",
      title: "ពីគ្រឹះក្នុងថ្នាក់រៀន ដល់កូដនៅផលិតកម្ម។",
      work: "បទពិសោធន៍ការងារ",
      education: "ការអប់រំ & បណ្តុះបណ្តាល",
    },
    projects: {
      eyebrow: "ការងារដែលបានជ្រើសរើស",
      title: "ផលិតផលពិត។ អ្នកប្រើពិត។ កំពុងដំណើរការក្នុងផលិតកម្ម។",
      description:
        "ផលិតផលបួនដែលខ្ញុំជួយបង្កើត និងថែទាំនៅ E-Power CCL — គ្របដណ្តប់ Backend, Frontend និងការថែទាំ។",
      cta: "ផលិតផលទាំងអស់ខាងលើកំពុងដំណើរការក្នុងផលិតកម្ម — ហើយខ្ញុំនៅតែថែទាំទាំងបួន។",
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
        "ប្រព័ន្ធផ្ទៃក្នុង ការភ្ជាប់ និង SDK — កូដដែលអ្នកប្រើមិនឃើញ ប៉ុន្តែអាជីវកម្មពឹងផ្អែកលើ។",
      difficulty: {
        Challenging: "ប្រឈម",
        Hard: "ពិបាក",
        Foundational: "មូលដ្ឋាន",
      },
    },
    personal: {
      eyebrow: "ផ្ទាល់ខ្លួន · ការស្រាវជ្រាវ",
      title: "គម្រោងផ្ទាល់ខ្លួនដែលខ្ញុំធ្វើដើម្បីរក្សាជំនាញ។",
      description:
        "គម្រោងផ្តួចផ្តើមដោយខ្លួនឯង និងការស្រាវជ្រាវ — ស្វែងយល់គំនិតផលិតផល, stack និង pattern ក្រៅពីការងារប្រចាំថ្ងៃ។",
      status: {
        Research: "ស្រាវជ្រាវ",
        Active: "កំពុងធ្វើ",
        Shipped: "ដាក់ឲ្យដំណើរការ",
      },
    },
    skills: {
      eyebrow: "ជំនាញ & ឧបករណ៍",
      title: "ឧបករណ៍ full-stack និង mobile សម្រាប់ការប្រើប្រាស់ជាក់ស្តែង។",
      description:
        "Stack ដែលខ្ញុំប្រើជារៀងរាល់ថ្ងៃ ដើម្បីរចនា បង្កើត ប្រគល់ និងថែទាំ។",
      groups: {
        Languages: "ភាសាសរសេរកម្មវិធី",
        "Frontend & Mobile": "Frontend & Mobile",
        "Backend & APIs": "Backend & API",
        Databases: "មូលដ្ឋានទិន្នន័យ",
        "DevOps & Cloud": "DevOps & Cloud",
        "Tooling & Collaboration": "ឧបករណ៍ & ការសហការ",
        "Design & AI": "រចនា & AI",
      },
    },
    contact: {
      eyebrow: "មកធ្វើការជាមួយគ្នា",
      title: "ជួលវិស្វករដែលដឹកនាំការងារឲ្យចេញដំណើរការរួចហើយ។",
      description:
        "ខ្ញុំបើកទទួលការងារពេញម៉ោង, Outsourcing mobile / web, និងគម្រោងខ្លី។ បើអ្នកត្រូវការអ្នកដែលអាចធ្វើការរហ័សលើ Backend, Frontend និង Mobile — សូមមកនិយាយគ្នា។",
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
      built: "បង្កើតជាមួយ Next.js & Tailwind CSS។",
      from: "រចនា & ប្រគល់ពី",
    },
    resume: {
      title: "ប្រវត្តិរូបសង្ខេប",
      backToPortfolio: "ត្រឡប់ទៅផតហ្វូលីយ៉ូ",
      download: "ទាញយក / បោះពុម្ព",
      summary: "ការសង្ខេប",
      experience: "បទពិសោធន៍",
      education: "ការអប់រំ & បណ្តុះបណ្តាល",
      selectedProjects: "គម្រោងដែលបានជ្រើសរើស",
      internalProjects: "គម្រោងផ្ទៃក្នុង · E-Power CCL",
      personalProjects: "គម្រោងផ្ទាល់ខ្លួន & ស្រាវជ្រាវ",
      skills: "ជំនាញ",
      contact: "ទំនាក់ទំនង",
      printedFrom: "បោះពុម្ពពី houng.pages.dev",
    },
    chat: {
      open: "ជជែកជាមួយខ្ញុំ",
      close: "បិទ",
      title: "Pov Lyhoung",
      subtitle: "ឆ្លើយតបជាធម្មតាក្នុងរយៈពេលពីរបីម៉ោង",
      status: "នៅលើបណ្តាញ",
      placeholder: "សរសេរសារ…",
      send: "ផ្ញើ",
      demoNote: "ការបង្ហាញគំរូ · ឆ្លើយតបជាគំរូ មុនពេលភ្ជាប់ Backend",
      typing: "កំពុងវាយ…",
      welcome:
        "សួស្តី 👋 អរគុណដែលបានមកលេង! ខ្ញុំឈ្មោះ Lyhoung។ សួរអ្វីក៏បាន — អំពីគម្រោងរបស់ខ្ញុំ បច្ចេកវិទ្យាដែលខ្ញុំប្រើ ឬការងារ។",
      suggestions: ["តើអ្នកអាចទទួលការងារដែរឬទេ?", "បង្ហាញគម្រោងរបស់អ្នក", "Stack អ្វីខ្លះ?"],
      replies: {
        greeting:
          "សួស្តី! រីករាយដែលបានជួប។ តើខ្ញុំអាចជួយអ្វីបាន? កំពុងស្វែងរកជួល ឬគ្រាន់តែចង់ដឹង?",
        hire:
          "បាទ — ខ្ញុំបើកទទួលការងារពេញម៉ោង និង Outsourcing។ ផ្ញើអ៊ីមែលមក povlyhoung02@gmail.com ឬមើលផ្នែក Contact ខាងក្រោម។",
        projects:
          "ខ្ញុំកំពុងបង្កើតផលិតផលបួននៅ E-Power CCL — Solar, EAC App, ePower Maps, Mobile Billing។ គម្រោងផ្ទាល់ខ្លួន៖ JRMS, E-Commerce, SS Garage។ មើលផ្នែក Projects ខាងលើ 👆",
        stack:
          "ភាគច្រើន Flutter, Next.js, Node.js, .NET, PostgreSQL, Docker។ បញ្ជីពេញនៅផ្នែក Skills។",
        phone: "ប្រាកដ — ហៅទូរសព្ទមកលេខ +855 15-357 776 ឬ +855 89-826 667។",
        resume:
          "មើល CV ពេញនៅ /resume — អាចបោះពុម្ពជា PDF បានដែរ។",
        email:
          "សាធារណៈ៖ povlyhoung02@gmail.com · ការងារ៖ pov.lyhoung@e-power.com.kh",
        thanks: "មិនអីទេ! ប្រាប់ខ្ញុំបើចង់ដឹងលម្អិតបន្ថែម។",
        default:
          "អរគុណសម្រាប់សារ — ខ្ញុំនឹងឆ្លើយតបក្នុងពេលឆាប់ៗ។ ផ្ញើអ៊ីមែលមក povlyhoung02@gmail.com បានដែរ។",
      },
    },
    settings: {
      theme: "ស្បែក",
      themeDark: "ងងឹត",
      themeLight: "ភ្លឺ",
      themeSystem: "តាមប្រព័ន្ធ",
      language: "ភាសា",
      langEn: "English",
      langKm: "ខ្មែរ",
    },
};

export const messages: Record<Lang, Messages> = { en, km };
