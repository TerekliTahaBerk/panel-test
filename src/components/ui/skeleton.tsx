import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Loading placeholder. Use only while real content is being fetched. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-line-row motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
