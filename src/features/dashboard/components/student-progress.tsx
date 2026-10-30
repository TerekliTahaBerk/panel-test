"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { formatPercent, formatSignedDelta } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GroupProgress, ProgressSeries } from "../types";

export const PROGRESS_WINDOWS = [4, 8, 12] as const;
export type ProgressWindow = (typeof PROGRESS_WINDOWS)[number];

const Y_MIN = 60;
const Y_MAX = 90;
const VB_W = 1100;
const VB_H = 220;

export function sliceSeries(series: ProgressSeries, weeks: ProgressWindow): ProgressSeries {
  return {
    weeks: series.weeks.slice(-weeks),
    achievement: series.achievement.slice(-weeks),
    homeworkCompletion: series.homeworkCompletion.slice(-weeks),
  };
}

function toPoints(values: number[]) {
  const step = VB_W / (values.length - 1);
  return values
    .map(
      (v, i) => `${+(i * step).toFixed(1)},${+(((Y_MAX - v) / (Y_MAX - Y_MIN)) * VB_H).toFixed(1)}`,
    )
    .join(" ");
}

function first(values: number[]) {
  return values[0] ?? 0;
}
function last(values: number[]) {
  return values.at(-1) ?? 0;
}

export function StudentProgress({
  series,
  groups,
}: {
  series: ProgressSeries;
  groups: GroupProgress[];
}) {
  const [windowSize, setWindowSize] = useState<ProgressWindow>(12);
  const data = sliceSeries(series, windowSize);
  const n = data.weeks.length;
  const ach = data.achievement;
  const hw = data.homeworkCompletion;

  const summary = [
    {
      label: "Ortalama başarı",
      swatch: "bg-chart-current",
      value: last(ach),
      delta: last(ach) - first(ach),
    },
    {
      label: "Ödev tamamlama",
      swatch: "bg-chart-comparison",
      value: last(hw),
      delta: last(hw) - first(hw),
    },
  ];

  // Every other week from the oldest, plus the current week at the right edge.
  const labels = data.weeks
    .map((week, i) => ({ week, i }))
    .filter(({ i }) => i === n - 1 || (i % 2 === 0 && i < n - 2) || i === n - 2);

  const chartLabel = `Son ${n} hafta: ortalama başarı ${formatPercent(first(ach))} → ${formatPercent(last(ach))}; ödev tamamlama ${formatPercent(first(hw))} → ${formatPercent(last(hw))}`;

  return (
    <Card aria-labelledby="h-gel" className="@container flex-[999_1_560px] px-5 pt-3.5 pb-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle id="h-gel">Öğrenci Gelişimi</CardTitle>
          <CardDescription>Tüm gruplar · haftalık ortalama</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Dönem: Son ${windowSize} hafta`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "font-normal")}
          >
            Son {windowSize} hafta
            <ChevronDown className="size-3.5 text-fg-muted" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-40">
            <DropdownMenuRadioGroup
              value={String(windowSize)}
              onValueChange={(v) => setWindowSize(Number(v) as ProgressWindow)}
            >
              {PROGRESS_WINDOWS.map((w) => (
                <DropdownMenuRadioItem key={w} value={String(w)}>
                  Son {w} hafta
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 mb-3.5 flex flex-wrap gap-8">
        {summary.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-meta text-fg-secondary">
              <span aria-hidden="true" className={cn("h-0.5 w-2.5 rounded-[1px]", s.swatch)} />
              {s.label}
            </span>
            <span className="flex items-baseline gap-2 tabular">
              <span className="text-stat font-semibold">{formatPercent(s.value)}</span>
              <span
                className={cn(
                  "text-meta font-medium",
                  s.delta >= 0 ? "text-success" : "text-fg-secondary",
                )}
              >
                {formatSignedDelta(s.delta)} puan
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
        <div
          aria-hidden="true"
          className="-mt-1.5 flex h-[200px] w-[22px] shrink-0 flex-col justify-between text-right text-micro text-fg-muted tabular max-md:h-[122px]"
        >
          <span>90</span>
          <span>80</span>
          <span>70</span>
          <span>60</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg
            role="img"
            aria-label={chartLabel}
            width="100%"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="block h-[188px] overflow-visible max-md:h-[110px]"
          >
            {[0.5, 73.3, 146.7].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={VB_W}
                y2={y}
                stroke="var(--ds-color-line-row)"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <line
              x1="0"
              y1="219.5"
              x2={VB_W}
              y2="219.5"
              stroke="var(--ds-color-chart-axis-line)"
              vectorEffect="non-scaling-stroke"
            />
            {n > 2 ? (
              <line
                x1={(VB_W / (n - 1)) * (n - 2)}
                y1="0"
                x2={(VB_W / (n - 1)) * (n - 2)}
                y2={VB_H}
                stroke="var(--ds-color-line-strong)"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <polyline
              points={toPoints(hw)}
              fill="none"
              stroke="var(--ds-color-chart-comparison)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={toPoints(ach)}
              fill="none"
              stroke="var(--ds-color-chart-current)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            aria-hidden="true"
            className="relative mt-2 h-[18px] text-micro text-fg-muted tabular"
          >
            {labels.map(({ week, i }) => {
              const pct = (i / (n - 1)) * 100;
              const isLast = i === n - 1;
              const isPrev = i === n - 2;
              return (
                <span
                  key={week}
                  className={cn(
                    "absolute whitespace-nowrap",
                    i === 0 ? "" : isLast ? "right-0" : "-translate-x-1/2",
                    isLast && "font-medium text-fg",
                    isPrev && "text-fg-secondary @max-[720px]:hidden",
                    !isLast && !isPrev && i !== 0 && "@max-[480px]:hidden",
                  )}
                  style={isLast ? undefined : { left: `${pct}%` }}
                >
                  {week}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <ul className="m-0 mt-[18px] grid list-none grid-cols-2 border-t border-line-row p-0 @min-[520px]:grid-cols-4">
        {groups.map((g) => (
          <li key={g.id} className="flex flex-col gap-1.5 pt-3.5 pr-4">
            <span className="text-meta text-fg-secondary">{g.name}</span>
            <span className="flex items-baseline gap-1.5 tabular">
              <span className="text-section font-semibold">{formatPercent(g.score)}</span>
              <span
                className={cn("text-caption", g.delta >= 0 ? "text-success" : "text-fg-secondary")}
              >
                {formatSignedDelta(g.delta)}
              </span>
            </span>
            <span
              role="progressbar"
              aria-label={`${g.name} başarı`}
              aria-valuenow={Math.round(g.score)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1 overflow-hidden rounded-[2px] bg-line-row"
            >
              <span
                className="block h-full rounded-[2px] bg-chart-current"
                style={{ width: `${Math.round(g.score)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
