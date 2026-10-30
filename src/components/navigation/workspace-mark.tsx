import { cn } from "@/lib/utils";

/** Neutral workspace logo mark from the prototype (stacked layers). */
export function WorkspaceMark({ size = 28, className }: { size?: 24 | 28; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary text-fg-inverse",
        size === 28 ? "size-7 rounded-btn-sm" : "size-6 rounded-sm",
        className,
      )}
    >
      <svg
        width={size === 28 ? 15 : 13}
        height={size === 28 ? 15 : 13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    </span>
  );
}
