import {
  CalendarDays,
  GraduationCap,
  Presentation,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { MetricIcon, MetricSnapshot } from "../types";
import { cn } from "@/lib/utils";

const icons: Record<MetricIcon, LucideIcon> = {
  students: GraduationCap,
  teachers: Presentation,
  lessons: CalendarDays,
  attendance: UserCheck,
};

export function MetricCard({ icon, metric }: { icon: MetricIcon; metric: MetricSnapshot }) {
  const Icon = icons[icon];
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-line px-[18px] py-4 @max-[520px]:gap-1 @max-[520px]:p-3.5">
      <h3 className="m-0 flex items-center gap-2 text-label font-normal text-fg-secondary @max-[520px]:text-meta">
        <Icon className="size-[15px] shrink-0 @max-[520px]:hidden" strokeWidth={1.8} />
        <span className="truncate">{metric.label}</span>
      </h3>
      <div className="flex items-end justify-between gap-2">
        <span className="text-metric font-semibold tabular @max-[520px]:text-[22px] @max-[520px]:leading-7">
          {metric.value}
        </span>
        <Sparkline points={metric.trend} className="@max-[520px]:hidden" />
      </div>
      <p className="m-0 flex min-w-0 items-center gap-x-1.5 text-meta text-fg-secondary tabular @max-[520px]:text-caption">
        <span
          className={cn(
            "shrink-0 font-medium whitespace-nowrap",
            metric.highlightTone === "positive" ? "text-success" : "text-fg",
          )}
        >
          {metric.highlight}
        </span>
        <span className="min-w-0 truncate">{metric.footnote}</span>
      </p>
    </div>
  );
}

/** 72×28 trend line with the latest point marked. Decorative. */
function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const step = 72 / (points.length - 1);
  const coords = points.map((y, i) => `${Math.round(i * step)},${y}`).join(" ");
  const last = points.at(-1) ?? 14;
  const prev = points.at(-2) ?? last;
  // Marker sits just inside the right edge, on the line.
  const cy = last + ((prev - last) * 2) / step;
  return (
    <svg
      width="72"
      height="28"
      viewBox="0 0 72 28"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <polyline
        points={coords}
        stroke="var(--ds-color-chart-target)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="70" cy={cy.toFixed(1)} r="2.2" fill="var(--ds-color-chart-current)" />
    </svg>
  );
}
