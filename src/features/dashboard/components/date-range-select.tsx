"use client";

import { Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DATE_RANGES, type DateRange } from "../types";

export const dateRangeLabels: Record<DateRange, string> = {
  today: "Bugün",
  week: "Bu hafta",
  month: "Bu ay",
};

export function DateRangeSelect({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Tarih aralığı: ${dateRangeLabels[value]}`}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-label whitespace-nowrap text-fg transition-colors hover:bg-subtle data-[state=open]:bg-subtle sm:h-[30px] sm:rounded-btn-sm sm:border sm:border-line sm:bg-canvas sm:hover:border-line-strong"
      >
        <Calendar className="size-[15px] text-fg-secondary" strokeWidth={1.8} />
        <span className="hidden sm:inline">{dateRangeLabels[value]}</span>
        <ChevronDown className="size-3.5 text-fg-muted" strokeWidth={1.8} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as DateRange)}>
          {DATE_RANGES.map((r) => (
            <DropdownMenuRadioItem key={r} value={r}>
              {dateRangeLabels[r]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
