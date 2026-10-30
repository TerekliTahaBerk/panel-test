import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know the custom type scale from globals.css, otherwise
 * `text-label` is mistaken for a color and silently drops `text-fg-inverse`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "title",
        "metric",
        "stat",
        "section",
        "body",
        "nav",
        "label",
        "meta",
        "caption",
        "micro",
      ],
    },
  },
});

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Initials for avatars, Turkish-locale aware ("ali çelik" → "AÇ"). */
export function getInitials(name: string, max = 2) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}
