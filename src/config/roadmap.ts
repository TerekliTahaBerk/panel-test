/**
 * Approved delivery roadmap. Navigation and docs reference these ids; see
 * docs/phases/README.md for each phase's scope.
 */
export const ROADMAP = [
  { id: "00", title: "Foundation & Design Integration" },
  { id: "01", title: "Architecture & Domain Modeling" },
  { id: "02", title: "Multi-Tenant Infrastructure" },
  { id: "03", title: "Authentication & Permissions" },
  { id: "04", title: "Complete Frontend Implementation" },
  { id: "05", title: "Organization Onboarding" },
  { id: "06", title: "Academic Management" },
  { id: "07", title: "Student & Parent Services" },
  { id: "08", title: "Exams & Analytics" },
  { id: "09", title: "Subscriptions & Billing" },
  { id: "10", title: "Super Admin & Operations" },
  { id: "11", title: "Security, QA & Production Launch" },
] as const;

export type RoadmapPhaseId = (typeof ROADMAP)[number]["id"];

export const CURRENT_PHASE: RoadmapPhaseId = "02";
