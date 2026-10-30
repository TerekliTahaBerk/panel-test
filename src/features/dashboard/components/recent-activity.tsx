"use client";

import {
  ChartLine,
  FileCheck,
  Megaphone,
  Play,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { useDemoAction } from "@/hooks/use-demo-action";
import type { Activity, ActivityKind } from "../types";

const icons: Record<ActivityKind, LucideIcon> = {
  lesson_started: Play,
  homework_submitted: FileCheck,
  attendance_saved: UserCheck,
  student_added: UserPlus,
  exam_published: ChartLine,
  announcement: Megaphone,
};

export function RecentActivity({ items }: { items: Activity[] }) {
  const demo = useDemoAction();
  return (
    <Card aria-labelledby="h-act" className="flex-[1_1_320px]">
      <div className="flex items-center justify-between pt-3.5 pr-4 pb-2.5 pl-5">
        <CardTitle id="h-act">Son Aktiviteler</CardTitle>
        <button
          type="button"
          onClick={() => demo("Tüm aktiviteler", "Etkinlik günlüğü sonraki bir fazda uygulanacak.")}
          className="text-label text-fg-secondary transition-colors hover:text-fg"
        >
          Tümü
        </button>
      </div>
      <ol className="m-0 list-none px-5 pt-1 pb-2">
        {items.map((a) => {
          const Icon = icons[a.kind];
          return (
            <li key={a.id} className="flex gap-3 py-2">
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-chip text-fg-secondary">
                <Icon className="size-[13px]" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 text-label">
                {a.actorLast ? (
                  <>
                    <span className="text-fg-secondary">{a.text}</span>{" "}
                    <span className="font-medium">{a.actor}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-fg-secondary">{a.text}</span>
                  </>
                )}
                <div className="mt-px text-caption text-fg-secondary tabular">{a.meta}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
