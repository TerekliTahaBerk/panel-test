import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("renders without console errors or horizontal overflow", async ({ page }, testInfo) => {
      const errors = collectConsoleErrors(page);
      await page.goto("/preview/admin");
      await expect(page.getByRole("heading", { level: 1, name: "Günaydın, Ayşe" })).toBeVisible();
      for (const section of [
        "Bugünün Programı",
        "Dikkat Gerektirenler",
        "Öğrenci Gelişimi",
        "Son Aktiviteler",
        "Hızlı İşlemler",
      ]) {
        await expect(page.getByRole("heading", { level: 2, name: section })).toBeVisible();
      }
      expect(await horizontalOverflow(page)).toBe(0);
      await page.screenshot({ path: testInfo.outputPath(`${vp.name}.png`), fullPage: true });
      if (process.env.UPDATE_REFERENCE_SCREENSHOTS) {
        await page.screenshot({
          path: `docs/design/screenshots/admin-${vp.name}.png`,
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  });
}

test.describe("desktop shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("collapses the sidebar to a rail with tooltips", async ({ page }) => {
    await page.goto("/preview/admin");
    const sidebar = page.getByRole("complementary", { name: "Kenar çubuğu" });
    await expect(sidebar).toBeVisible();
    const before = (await sidebar.boundingBox())?.width ?? 0;
    expect(before).toBe(252 - 1); // border lives on the wrapper

    await page.getByRole("button", { name: "Kenar çubuğunu daralt" }).click();
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(64 - 1);
    await sidebar.getByRole("button", { name: "Ödevler" }).hover();
    await expect(page.getByRole("tooltip", { name: "Ödevler" })).toBeVisible();
    expect(await horizontalOverflow(page)).toBe(0);

    await page.getByRole("button", { name: "Kenar çubuğunu genişlet" }).click();
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(252 - 1);
  });

  test("opens the command palette with the keyboard", async ({ page }) => {
    await page.goto("/preview/admin");
    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.getByRole("dialog", { name: "Komut paleti" });
    await expect(palette).toBeVisible();
    await page.keyboard.type("analiz");
    await expect(palette.getByRole("option", { name: /Analizler/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();
  });

  test("filters the schedule with keyboard-operable tabs", async ({ page }) => {
    await page.goto("/preview/admin");
    const schedule = page.getByRole("region", { name: "Bugünün Programı" });
    await schedule.getByRole("tab", { name: "Tümü" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(schedule.getByRole("tab", { name: "Devam eden" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(schedule.getByRole("table").getByRole("row")).toHaveCount(2);
  });
});

test.describe("mobile shell", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("uses a drawer for navigation", async ({ page }) => {
    await page.goto("/preview/admin");
    await expect(page.getByRole("complementary", { name: "Kenar çubuğu" })).toBeHidden();
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    const drawer = page.getByRole("dialog", { name: "Gezinme menüsü" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: /Genel Bakış/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await horizontalOverflow(page)).toBe(0);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("primary controls meet the 44px touch target", async ({ page }) => {
    await page.goto("/preview/admin");
    for (const name of ["Menüyü aç", "Ara", "Bildirimler, 3 okunmamış"]) {
      const box = await page.getByRole("button", { name, exact: true }).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
