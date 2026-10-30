import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-fg-inverse hover:bg-primary-hover",
        secondary: "border border-line bg-canvas text-fg hover:border-line-strong hover:bg-subtle",
        ghost: "text-fg hover:bg-hover",
      },
      size: {
        sm: "h-7 rounded-btn-sm px-2.5 text-meta",
        md: "h-8 rounded-md px-3 text-label",
        lg: "h-9 rounded-md px-3.5 text-body",
        touch: "h-11 rounded-lg px-4 text-body",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, loading, disabled, children, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Spinner /> : null}
          {children}
        </>
      )}
    </Comp>
  );
});
