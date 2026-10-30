import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {icon ? (
        <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-chip text-fg-secondary [&_svg]:size-[18px]">
          {icon}
        </span>
      ) : null}
      <p className="m-0 text-nav font-medium">{title}</p>
      {description ? (
        <p className="mt-1 mb-0 max-w-80 text-meta text-fg-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
