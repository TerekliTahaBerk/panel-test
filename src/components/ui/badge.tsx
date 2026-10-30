import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center whitespace-nowrap tabular", {
  variants: {
    variant: {
      /** Count next to a section title ("7 ders"). */
      count: "rounded-sm bg-chip px-[7px] py-px text-caption text-fg-secondary",
      /** Group / category tag. */
      tag: "h-[22px] rounded-sm bg-chip px-2 text-meta text-fg-subtle",
      /** Marks demonstration content. */
      demo: "h-5 rounded-sm border border-dashed border-line-strong px-1.5 text-micro font-medium text-fg-secondary",
    },
  },
  defaultVariants: { variant: "tag" },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
