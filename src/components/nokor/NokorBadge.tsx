import type { NokorBadgeKind } from "@/lib/supabase/types";

/** Facebook-style verified/creator badge: a scalloped blue (or amber) seal with
 *  a white check. Rendered beside a display name when a profile carries a badge. */
export default function NokorBadge({
  kind,
  size = 15,
  className = "",
}: {
  kind: NokorBadgeKind | null | undefined;
  size?: number;
  className?: string;
}) {
  if (!kind) return null;
  const color = kind === "creator" ? "#f59e0b" : "#1877f2";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={kind === "creator" ? "Creator" : "Verified"}
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
    >
      {/* 12-lobe seal */}
      <path
        fill={color}
        d="M12 1.6l2.03 1.79 2.7-.36.98 2.54 2.54.98-.36 2.7L23.3 12l-1.79 2.03.36 2.7-2.54.98-.98 2.54-2.7-.36L12 22.4l-2.03-1.79-2.7.36-.98-2.54-2.54-.98.36-2.7L.7 12l1.79-2.03-.36-2.7 2.54-.98.98-2.54 2.7.36z"
      />
      <path
        d="M7.6 12.2l2.7 2.7 5.5-5.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
