"use client";

import { CalendarX, ChevronRight, Ellipsis } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plannedScreenMessage, useDemoAction } from "@/hooks/use-demo-action";
import type { ScheduleFilter, ScheduledLesson } from "../types";
import { LessonStatus } from "./lesson-status";

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "live", label: "Devam eden" },
  { id: "upcoming", label: "Yaklaşan" },
  { id: "done", label: "Tamamlanan" },
];

export function filterLessons(lessons: ScheduledLesson[], filter: ScheduleFilter) {
  switch (filter) {
    case "all":
      return lessons;
    case "live":
      return lessons.filter((l) => l.status === "live");
    case "upcoming":
      return lessons.filter((l) => l.status === "upcoming");
    case "done":
      return lessons.filter((l) => l.status === "done" || l.status === "attendance_pending");
  }
}

interface TodayScheduleProps {
  lessons: ScheduledLesson[];
  summary: string;
  updatedAt: string;
}

export function TodaySchedule({ lessons, summary, updatedAt }: TodayScheduleProps) {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const demo = useDemoAction();

  return (
    <Card aria-labelledby="h-prog" className="@container flex-[999_1_560px]">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as ScheduleFilter)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle id="h-prog">Bugünün Programı</CardTitle>
            <Badge variant="count">{lessons.length} ders</Badge>
          </div>
          <div className="flex max-w-full min-w-0 items-center gap-2.5 @max-[599px]:w-full">
            <TabsList aria-label="Durum filtresi" className="@max-[599px]:w-full">
              {FILTERS.map((f) => (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  className="@max-[599px]:flex-1 @max-[599px]:px-1.5"
                >
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <button
              type="button"
              onClick={() => demo("Ders Takvimi", plannedScreenMessage("03"))}
              className="flex shrink-0 items-center gap-1 text-label whitespace-nowrap text-fg-secondary transition-colors hover:text-fg max-lg:touch-hit @max-[599px]:hidden"
            >
              Takvim
              <ChevronRight className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </CardHeader>

        {FILTERS.map((f) => {
          const rows = filterLessons(lessons, f.id);
          return (
            <TabsContent key={f.id} value={f.id} className="border-t border-line">
              {rows.length === 0 ? (
                <EmptyState
                  icon={<CalendarX />}
                  title="Bu filtrede ders yok"
                  description="Başka bir durum seçin veya takvimi açın."
                />
              ) : (
                <>
                  <ScheduleTable rows={rows} />
                  <ScheduleList rows={rows} />
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-[11px] text-meta text-fg-secondary tabular">
        <span>{summary}</span>
        <span>{updatedAt}</span>
      </div>
    </Card>
  );
}

const th = "border-b border-line px-3 py-[9px] font-medium";
const td = "border-b border-line-row px-3 py-[11px] align-middle";

function ScheduleTable({ rows }: { rows: ScheduledLesson[] }) {
  return (
    <div className="hidden overflow-x-auto @min-[600px]:block">
      <table className="w-full min-w-[600px] border-collapse text-nav">
        <thead>
          <tr className="text-left text-caption text-fg-secondary">
            <th scope="col" className={`${th} w-24 pl-5`}>
              Saat
            </th>
            <th scope="col" className={th}>
              Ders
            </th>
            <th scope="col" className={th}>
              Öğretmen
            </th>
            <th scope="col" className={th}>
              Grup
            </th>
            <th scope="col" className={th}>
              Durum
            </th>
            <th scope="col" className={`${th} w-11 pl-0`}>
              <span className="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lesson) => (
            <tr key={lesson.id} className="transition-colors hover:bg-row-hover">
              <td className={`${td} pl-5 tabular`}>
                <div className="leading-[18px] font-medium">{lesson.start}</div>
                <div className="text-caption text-fg-secondary">{lesson.end}</div>
              </td>
              <td className={td}>
                <div className="leading-[18px] font-medium">{lesson.subject}</div>
                <div className="text-meta text-fg-secondary">{lesson.topic}</div>
              </td>
              <td className={td}>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Avatar name={lesson.teacher} size="xs" />
                  {lesson.teacher}
                </div>
              </td>
              <td className={td}>
                <Badge variant="tag">{lesson.group}</Badge>
              </td>
              <td className={`${td} text-label whitespace-nowrap`}>
                <LessonStatus lesson={lesson} />
              </td>
              <td className={`${td} pl-0 text-right`}>
                <LessonActions lesson={lesson} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Narrow containers: tables become lists (prototype 13 Mobil). */
function ScheduleList({ rows }: { rows: ScheduledLesson[] }) {
  return (
    <ul className="m-0 list-none p-0 @min-[600px]:hidden">
      {rows.map((lesson, index) => (
        <li
          key={lesson.id}
          className={`flex gap-3.5 py-3 pr-2 pl-4 ${index > 0 ? "border-t border-line-row" : ""}`}
        >
          <div className="w-11 shrink-0 tabular">
            <div className="text-nav font-medium">{lesson.start}</div>
            <div className="text-caption text-fg-secondary">{lesson.end}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-medium">
              {lesson.subject}{" "}
              <span className="font-normal text-fg-secondary">· {lesson.group}</span>
            </div>
            <div className="mt-px text-meta text-fg-secondary">{lesson.teacher}</div>
            <div className="mt-1.5 text-meta">
              <LessonStatus lesson={lesson} />
            </div>
          </div>
          <LessonActions lesson={lesson} touch />
        </li>
      ))}
    </ul>
  );
}

function LessonActions({ lesson, touch }: { lesson: ScheduledLesson; touch?: boolean }) {
  const demo = useDemoAction();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={`${lesson.start} ${lesson.subject} dersi işlemleri`}
          size={touch ? "touch" : "md"}
          tone="muted"
        >
          <Ellipsis className="size-4" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => demo("Ders detayı", plannedScreenMessage("03"))}>
          Ders detayı
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => demo("Yoklama al")}>Yoklama al</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => demo("Dersi düzenle")}>Dersi düzenle</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
