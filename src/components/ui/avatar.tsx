import { cva, type VariantProps } from "class-variance-authority";
import { cn, getInitials } from "@/lib/utils";

export const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
  {
    variants: {
      size: {
        xs: "size-[22px] text-[9.5px]",
        sm: "size-[26px] text-[10px]",
        md: "size-7 text-micro",
      },
      tone: {
        neutral: "bg-avatar text-fg-avatar",
        strong: "bg-avatar-strong text-fg-subtle",
      },
    },
    defaultVariants: { size: "md", tone: "neutral" },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  /** Override computed initials (e.g. "AY"). */
  initials?: string;
  className?: string;
  /** Decorative when the name is printed next to it. */
  decorative?: boolean;
}

export function Avatar({ name, initials, size, tone, className, decorative = true }: AvatarProps) {
  return (
    <span
      className={cn(avatarVariants({ size, tone }), className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      {initials ?? getInitials(name)}
    </span>
  );
}
