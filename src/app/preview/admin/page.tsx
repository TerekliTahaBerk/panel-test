import type { Metadata } from "next";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import {
  adminDashboardMock,
  previewNotificationsMock,
} from "@/features/dashboard/data/admin-dashboard.mock";

export const metadata: Metadata = {
  title: "Genel Bakış — Önizleme",
};

export default function AdminPreviewPage() {
  return <AdminDashboard data={adminDashboardMock} notifications={previewNotificationsMock} />;
}
