import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./tooltip";

export const iconButtonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center text-fg-secondary transition-colors hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-hover data-[state=open]:text-fg",
  {
    variants: {
      size: {
        sm: "size-6 rounded-sm",
        md: "size-7 rounded-btn-sm",
        lg: "size-[30px] rounded-btn-sm",
        touch: "size-11 rounded-md",
      },
      tone: {
        default: "",
        muted: "text-fg-muted",
        strong: "text-fg",
      },
    },
    defaultVariants: { size: "lg", tone: "default" },
  },
);

export interface IconButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible name. Required: icon-only controls have no visible text. */
  label: string;
  /** Show the label in a tooltip on hover/focus. */
  tooltip?: boolean | string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tooltip, className, size, tone, type, ...props },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-label={label}
      className={cn(iconButtonVariants({ size, tone }), className)}
      {...props}
    />
  );
  if (!tooltip) return button;
  return <Tooltip content={typeof tooltip === "string" ? tooltip : label}>{button}</Tooltip>;
});
