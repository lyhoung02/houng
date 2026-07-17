"use client";

import { useT } from "../providers/LanguageProvider";

export type NokorTab = "home" | "activity" | "chat" | "profile";

function Icon({ tab, active }: { tab: NokorTab; active: boolean }) {
  const stroke = active ? 2.1 : 1.7;
  const fill = active ? "currentColor" : "none";
  switch (tab) {
    case "home":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "activity":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={fill} aria-hidden>
          <path d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2.6 4.5 6.4 4.5c2.2 0 3.7 1.2 5.6 3.3 1.9-2.1 3.4-3.3 5.6-3.3 3.8 0 6 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3.4A8 8 0 1 1 21 12z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
        </svg>
      );
    case "profile":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth={stroke} />
          <path d="M5 20c.7-3.6 3.4-5.4 7-5.4s6.3 1.8 7 5.4" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
        </svg>
      );
  }
}

export default function NokorTabBar({
  active,
  onChange,
  onNewPost,
  activityCount = 0,
}: {
  active: NokorTab;
  onChange: (tab: NokorTab) => void;
  onNewPost: () => void;
  activityCount?: number;
}) {
  const t = useT();
  // Two tabs on each side of the center compose button.
  const left: { key: NokorTab; label: string }[] = [
    { key: "home", label: t.nokor.tabs.home },
    { key: "chat", label: t.nokor.tabs.chat },
  ];
  const right: { key: NokorTab; label: string }[] = [
    { key: "activity", label: t.nokor.tabs.activity },
    { key: "profile", label: t.nokor.tabs.profile },
  ];

  const TabButton = ({ tab }: { tab: { key: NokorTab; label: string } }) => {
    const on = active === tab.key;
    return (
      <button
        type="button"
        onClick={() => onChange(tab.key)}
        aria-current={on ? "page" : undefined}
        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
          on ? "text-indigo-400" : "opacity-60 hover:opacity-100"
        }`}
      >
        <span className="relative">
          <Icon tab={tab.key} active={on} />
          {tab.key === "activity" && activityCount > 0 && (
            <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {activityCount > 9 ? "9+" : activityCount}
            </span>
          )}
        </span>
        {tab.label}
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {left.map((tab) => (
          <TabButton key={tab.key} tab={tab} />
        ))}

        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onNewPost}
            aria-label={t.nokor.feed.newPost}
            className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {right.map((tab) => (
          <TabButton key={tab.key} tab={tab} />
        ))}
      </div>
    </nav>
  );
}
