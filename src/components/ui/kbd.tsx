import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center rounded-xs border border-line-kbd bg-canvas px-1.5 font-sans text-micro font-medium tracking-[0.02em] text-fg-secondary",
        className,
      )}
      {...props}
    />
  );
}
