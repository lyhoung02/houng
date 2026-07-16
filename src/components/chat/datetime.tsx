import type { Lang } from "@/lib/i18n/messages";

const LOCALES: Record<Lang, string> = { en: "en-GB", km: "km-KH" };

export function formatTime(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** "Today" / "Yesterday" / localized date for the day-separator chips. */
export function dayLabel(
  iso: string,
  lang: Lang,
  labels: { today: string; yesterday: string },
) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(iso, now.toISOString())) return labels.today;
  if (isSameDay(iso, yesterday.toISOString())) return labels.yesterday;

  const d = new Date(iso);
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }).format(d);
}

export function DateChip({ label }: { label: string }) {
  return (
    <p className="text-center py-1">
      <span className="inline-block rounded-full bg-surface-strong px-2.5 py-0.5 text-[10px] text-foreground/60">
        {label}
      </span>
    </p>
  );
}
