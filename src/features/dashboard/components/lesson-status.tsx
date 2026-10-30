import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import type { ScheduledLesson } from "../types";

export function LessonStatus({ lesson }: { lesson: ScheduledLesson }) {
  switch (lesson.status) {
    case "live":
      return (
        <span className="inline-flex items-center gap-[7px] font-medium text-success">
          <span
            aria-hidden="true"
            className="size-[7px] animate-pulse-live rounded-full bg-success-dot"
          />
          Devam ediyor
        </span>
      );
    case "done":
      return (
        <span className="inline-flex items-center gap-1.5 text-fg-secondary">
          <CircleCheck className="size-3.5" strokeWidth={2} />
          Tamamlandı
        </span>
      );
    case "attendance_pending":
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-warning">
          <CircleAlert className="size-3.5" strokeWidth={2} />
          Yoklama bekliyor
        </span>
      );
    case "upcoming":
      return (
        <span className="inline-flex items-center gap-1.5 text-fg-secondary">
          <Clock className="size-3.5" strokeWidth={2} />
          <span>
            <span className="sr-only">Yaklaşan, </span>
            {lesson.eta}
          </span>
        </span>
      );
  }
}
