"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

/** Segmented tab list, as used for in-card filters. */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex max-w-full gap-0.5 overflow-x-auto rounded-md bg-chip p-0.5", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "h-[26px] shrink-0 rounded-sm px-2.5 text-meta whitespace-nowrap text-fg-secondary transition-colors hover:text-fg disabled:opacity-50 data-[state=active]:bg-canvas data-[state=active]:font-medium data-[state=active]:text-fg data-[state=active]:shadow-segment",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("outline-none", className)} {...props} />;
}
