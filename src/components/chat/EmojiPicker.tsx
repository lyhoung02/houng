"use client";

/**
 * A small curated grid rather than a full emoji library: the site is a static
 * export with a strict budget, and an emoji-data dependency would dwarf the
 * whole chat feature. Native keyboards still cover anything not listed here.
 */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "😢", "🙏"];

const GROUPS: { label: string; emoji: string[] }[] = [
  {
    label: "Smileys",
    emoji: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🙂", "😉",
      "😊", "😍", "😘", "😜", "🤔", "🤗", "😎", "🥳",
      "😐", "😴", "😭", "😡", "🥺", "😱", "🤯", "😇",
    ],
  },
  {
    label: "Gestures",
    emoji: ["👍", "👎", "👌", "✌️", "🤝", "👏", "🙏", "💪", "🫡", "👋", "🤙", "✍️"],
  },
  {
    label: "Objects",
    emoji: ["❤️", "🔥", "✨", "🎉", "🚀", "💡", "📌", "📎", "💻", "📱", "⚡", "✅"],
  },
];

export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Click-away layer, so tapping the message list dismisses the picker. */}
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        // Stacked directly on top of the input, spanning the composer's width.
        className="absolute bottom-full mb-2 inset-x-0 z-20 max-h-56 overflow-y-auto rounded-xl border border-border bg-background/95 backdrop-blur p-2 shadow-xl"
        role="dialog"
        aria-label="Emoji"
      >
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-2 last:mb-0">
            <p className="text-[10px] uppercase tracking-wide text-foreground/40 px-1 mb-1">
              {g.label}
            </p>
            {/* Wraps to the container width rather than a fixed column count. */}
            <div className="flex flex-wrap gap-0.5">
              {g.emoji.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onPick(e);
                    onClose();
                  }}
                  className="h-7 w-7 grid place-items-center rounded hover:bg-surface-strong text-base leading-none"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
