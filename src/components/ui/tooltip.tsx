"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** When true the tooltip is suppressed (e.g. label already visible). */
  disabled?: boolean;
  className?: string;
}

export function Tooltip({ content, children, side = "bottom", disabled, className }: TooltipProps) {
  if (disabled) return <>{children}</>;
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 max-w-64 rounded-sm bg-primary px-2 py-1 text-caption font-medium text-fg-inverse shadow-popover data-[state=delayed-open]:animate-fade-in",
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
