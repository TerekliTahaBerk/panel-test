"use client";

import { CalendarPlus, FilePlus, Megaphone, UserPlus, type LucideIcon } from "lucide-react";
import { useDemoAction } from "@/hooks/use-demo-action";
import type { QuickAction, QuickActionId } from "../types";

export const quickActionIcons: Record<QuickActionId, LucideIcon> = {
  add_student: UserPlus,
  create_lesson: CalendarPlus,
  assign_homework: FilePlus,
  create_announcement: Megaphone,
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const demo = useDemoAction();
  return (
    <section
      aria-labelledby="h-qa"
      className="min-w-0 rounded-xl border border-line px-4 pt-3.5 pb-4"
    >
      <h2 id="h-qa" className="m-0 mb-3 ml-1 text-section font-semibold">
        Hızlı İşlemler
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = quickActionIcons[action.id];
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => demo(action.label)}
              className="flex h-11 min-w-0 items-center gap-2 rounded-qa border border-line bg-canvas px-2.5 text-left text-label leading-4 font-medium transition-colors hover:border-line-strong hover:bg-subtle max-lg:h-12"
            >
              <Icon className="size-4 shrink-0 text-fg-secondary" strokeWidth={1.8} />
              <span className="min-w-0">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
