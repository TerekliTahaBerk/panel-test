"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { useShell } from "@/components/layout/shell-context";
import type { NotificationItem } from "@/components/navigation/notifications-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDemoAction } from "@/hooks/use-demo-action";
import type { AdminDashboardData, DateRange } from "../types";
import { AttentionList } from "./attention-list";
import { DateRangeSelect } from "./date-range-select";
import { MetricCard } from "./metric-card";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import { StudentProgress } from "./student-progress";
import { TodaySchedule } from "./today-schedule";

const NEW_ITEMS = ["Öğrenci", "Öğretmen", "Ders", "Ödev", "Duyuru"] as const;

interface AdminDashboardProps {
  data: AdminDashboardData;
  notifications: NotificationItem[];
}

/** Organization Administrator overview (prototype screen 01). */
export function AdminDashboard({ data, notifications }: AdminDashboardProps) {
  const [range, setRange] = useState<DateRange>("week");
  const { workspace, basePath } = useShell();
  const demo = useDemoAction();

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: workspace.organization.name, href: basePath },
          { label: "Genel Bakış" },
        ]}
        actions={<DateRangeSelect value={range} onChange={setRange} />}
        notifications={notifications}
      />
      <main id="main" tabIndex={-1} className="@container w-full max-w-content outline-none">
        <div className="flex flex-col gap-5 px-4 pt-5 pb-10 md:gap-6 md:px-10 md:pt-7 md:pb-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-meta text-fg-secondary tabular sm:hidden">
                {data.dateLabel}
              </span>
              <h1 className="m-0 text-title font-semibold max-sm:text-[24px] max-sm:leading-[30px]">
                {data.greeting}
              </h1>
              <p className="m-0 text-body text-fg-secondary">{data.subtitle}</p>
            </div>
            <div className="flex items-center gap-3 max-sm:w-full">
              <span className="hidden text-label whitespace-nowrap text-fg-secondary tabular sm:inline">
                {data.dateLabel}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="primary"
                    className="pr-2.5 pl-2.5 max-sm:h-11 max-sm:w-full max-sm:rounded-lg max-sm:text-body"
                  >
                    <Plus className="size-[15px]" strokeWidth={2} />
                    Yeni Ekle
                    <ChevronDown className="size-3.5 opacity-60" strokeWidth={1.8} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-44">
                  {NEW_ITEMS.map((item) => (
                    <DropdownMenuItem
                      key={item}
                      onSelect={() => demo(`Yeni ${item.toLocaleLowerCase("tr-TR")}`)}
                    >
                      {item}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <section
            aria-label="Temel göstergeler"
            className="grid grid-cols-2 gap-3 @max-[520px]:gap-2 @min-[860px]:grid-cols-4"
          >
            {data.metrics.map((m) => (
              <MetricCard key={m.id} icon={m.id} metric={m.byRange[range]} />
            ))}
          </section>

          <div className="flex flex-wrap items-start gap-5">
            <TodaySchedule
              lessons={data.schedule.lessons}
              summary={data.schedule.summary}
              updatedAt={data.schedule.updatedAt}
            />
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
              <AttentionList items={data.attention} />
              <QuickActions actions={data.quickActions} />
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-5">
            <StudentProgress series={data.progress.series} groups={data.progress.groups} />
            <RecentActivity items={data.activities} />
          </div>
        </div>
      </main>
    </>
  );
}
