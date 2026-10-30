import { z } from "zod";

export const DATE_RANGES = ["today", "week", "month"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export type MetricIcon = "students" | "teachers" | "lessons" | "attendance";

export interface MetricSnapshot {
  label: string;
  value: string;
  /** Emphasised lead of the footnote ("+12"). */
  highlight: string;
  highlightTone: "positive" | "neutral";
  footnote: string;
  /** Sparkline: 7 y-coordinates (oldest first) in a 72×28 box; lower is higher. */
  trend: number[];
}

export interface Metric {
  id: MetricIcon;
  byRange: Record<DateRange, MetricSnapshot>;
}

export const LESSON_STATUSES = ["done", "attendance_pending", "live", "upcoming"] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export type ScheduleFilter = "all" | "live" | "upcoming" | "done";

export interface ScheduledLesson {
  id: string;
  start: string;
  end: string;
  subject: string;
  topic: string;
  teacher: string;
  group: string;
  status: LessonStatus;
  /** Shown for upcoming lessons ("48 dk sonra" or the start time). */
  eta?: string;
}

export type AttentionSeverity = "critical" | "warning" | "info";

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  actionLabel: string;
}

export interface ProgressSeries {
  /** Week labels, oldest first. The last one is the current week. */
  weeks: string[];
  achievement: number[];
  homeworkCompletion: number[];
}

export interface GroupProgress {
  id: string;
  name: string;
  score: number;
  delta: number;
}

export type ActivityKind =
  | "lesson_started"
  | "homework_submitted"
  | "attendance_saved"
  | "student_added"
  | "exam_published"
  | "announcement";

export interface Activity {
  id: string;
  kind: ActivityKind;
  /** Rendered as: [actor] [text] or [text] [actor] when actorLast. */
  actor: string;
  text: string;
  actorLast?: boolean;
  meta: string;
}

export type QuickActionId =
  "add_student" | "create_lesson" | "assign_homework" | "create_announcement";

export interface QuickAction {
  id: QuickActionId;
  label: string;
}

export interface AdminDashboardData {
  greeting: string;
  subtitle: string;
  dateLabel: string;
  metrics: Metric[];
  schedule: {
    lessons: ScheduledLesson[];
    summary: string;
    updatedAt: string;
  };
  attention: AttentionItem[];
  progress: { series: ProgressSeries; groups: GroupProgress[] };
  activities: Activity[];
  quickActions: QuickAction[];
}

/**
 * Validation contract for a lesson row. Not used at runtime in Phase 00;
 * it documents the shape the Phase 01 API must return and is exercised by
 * the unit tests against the mock data.
 */
export const scheduledLessonSchema = z.object({
  id: z.string().min(1),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  subject: z.string().min(1),
  topic: z.string(),
  teacher: z.string().min(1),
  group: z.string().min(1),
  status: z.enum(LESSON_STATUSES),
  eta: z.string().optional(),
});
