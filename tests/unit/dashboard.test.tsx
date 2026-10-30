import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { adminDashboardMock } from "@/features/dashboard/data/admin-dashboard.mock";
import { renderAdminPreview } from "../render";

describe("Organization Administrator dashboard", () => {
  it("renders the greeting, the four metrics and every section", () => {
    renderAdminPreview();
    expect(screen.getByRole("heading", { level: 1, name: "Günaydın, Ayşe" })).toBeInTheDocument();

    const metrics = screen.getByRole("region", { name: "Temel göstergeler" });
    for (const label of [
      "Aktif Öğrenciler",
      "Öğretmenler",
      "Bu Haftaki Dersler",
      "Ortalama Katılım",
    ]) {
      expect(within(metrics).getByRole("heading", { name: label })).toBeInTheDocument();
    }

    for (const section of [
      "Bugünün Programı",
      "Dikkat Gerektirenler",
      "Öğrenci Gelişimi",
      "Son Aktiviteler",
      "Hızlı İşlemler",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: section })).toBeInTheDocument();
    }
  });

  it("marks the preview as demonstration data", () => {
    renderAdminPreview();
    expect(screen.getByText("Demo verisi")).toBeInTheDocument();
  });

  it("filters today's schedule with the status tabs", async () => {
    const { user } = renderAdminPreview();
    const schedule = screen.getByRole("region", { name: "Bugünün Programı" });
    const table = () => within(schedule).getByRole("table");

    expect(within(table()).getAllByRole("row")).toHaveLength(
      adminDashboardMock.schedule.lessons.length + 1,
    );

    await user.click(within(schedule).getByRole("tab", { name: "Devam eden" }));
    expect(within(schedule).getByRole("tab", { name: "Devam eden" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(table()).getAllByRole("row")).toHaveLength(2);
    expect(within(table()).getByText("TYT Problemler")).toBeInTheDocument();

    await user.click(within(schedule).getByRole("tab", { name: "Tamamlanan" }));
    expect(within(table()).getAllByRole("row")).toHaveLength(4);
  });

  it("switches metric values with the date-range selector", async () => {
    const { user } = renderAdminPreview();
    await user.click(screen.getByRole("button", { name: "Tarih aralığı: Bu hafta" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Bugün" }));
    const metrics = screen.getByRole("region", { name: "Temel göstergeler" });
    expect(within(metrics).getByRole("heading", { name: "Bugünkü Dersler" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tarih aralığı: Bugün" })).toBeInTheDocument();
  });

  it("changes the progress window", async () => {
    const { user } = renderAdminPreview();
    await user.click(screen.getByRole("button", { name: "Dönem: Son 12 hafta" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Son 4 hafta" }));
    expect(screen.getByRole("img", { name: /^Son 4 hafta/ })).toBeInTheDocument();
  });

  it("shows an explicit demo notice instead of faking backend actions", async () => {
    const { user } = renderAdminPreview();
    await user.click(screen.getByRole("button", { name: "Yoklama al" }));
    expect(await screen.findByText("Önizleme · Yoklama al")).toBeInTheDocument();
    expect(screen.getByText(/hiçbir değişiklik kaydedilmez/)).toBeInTheDocument();
  });
});
