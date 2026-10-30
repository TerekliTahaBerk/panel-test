import { expect, test, type Page } from "@playwright/test";

/**
 * Below the lg breakpoint every visible interactive control in the topbar
 * and dashboard must have an effective touch target of at least 44×44px.
 * "Effective" = the area that actually receives the tap: we probe points
 * around the control's centre with elementFromPoint, so invisible hit-area
 * extensions count and overlapping neighbours are caught.
 */
const MIN = 44;
const CONTROLS =
  'button, a[href], [role="tab"], [role="button"], [tabindex="0"], input, select, textarea';

interface Finding {
  name: string;
  width: number;
  height: number;
  missed: string[];
}

async function auditTouchTargets(page: Page) {
  const scopes = page.locator("header, main#main");
  const handles = await scopes.locator(CONTROLS).elementHandles();
  const findings: Finding[] = [];
  let audited = 0;

  for (const handle of handles) {
    const visible = await handle.evaluate((el: Element) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 1 &&
        rect.height > 1
      );
    });
    if (!visible) continue;
    await handle.evaluate((el: Element) =>
      el.scrollIntoView({ block: "center", inline: "center" }),
    );
    audited += 1;

    const result = await handle.evaluate((el: Element, min: number) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const half = min / 2 - 1; // probe just inside a 44×44 box around the centre
      const probes: [string, number, number][] = [
        ["centre", cx, cy],
        ["top", cx, cy - half],
        ["bottom", cx, cy + half],
        ["left", cx - half, cy],
        ["right", cx + half, cy],
      ];
      const missed = probes
        .filter(([, x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return !hit || !(hit === el || el.contains(hit));
        })
        .map(([label]) => label);
      const name =
        el.getAttribute("aria-label") ||
        (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40) ||
        el.tagName.toLowerCase();
      return { name, width: Math.round(rect.width), height: Math.round(rect.height), missed };
    }, MIN);

    if (result.missed.length) findings.push(result);
  }
  return { audited, findings };
}

for (const vp of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
]) {
  test(`${vp.name}: every visible dashboard control has a ≥44px touch target`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/preview/admin");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const { audited, findings } = await auditTouchTargets(page);
    testInfo.annotations.push({ type: "audited-controls", description: String(audited) });
    // Guard against an empty selector silently passing.
    expect(audited).toBeGreaterThan(25);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });
}

test("mobile-390: drawer navigation controls have ≥44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/admin");
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  const drawer = page.getByRole("dialog", { name: "Gezinme menüsü" });
  await expect(drawer).toBeVisible();
  const controls = drawer.locator("button, a[href]");
  const count = await controls.count();
  expect(count).toBeGreaterThan(15);
  for (let i = 0; i < count; i++) {
    const box = await controls.nth(i).boundingBox();
    expect(box?.height, await controls.nth(i).innerText()).toBeGreaterThanOrEqual(MIN);
  }
});
