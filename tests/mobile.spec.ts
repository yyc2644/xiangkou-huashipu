import { expect, test, type Page } from "@playwright/test";

const finishTutorial = async (page: Page) => {
  await page.goto("/");
  await page.locator('[data-tutorial-cell="0"]').click();
  await page.locator('[data-tutorial-cell="1"]').click();
  await page.locator("[data-tutorial-next]").click();
  await page.locator("[data-tutorial-generator]").click();
  await page.locator("[data-tutorial-next]").click();
  await page.locator("[data-tutorial-order]").click();
  await page.locator("[data-tutorial-next]").click();
  await page.locator("[data-tutorial-complete]").click();
  await expect(page.locator(".game-shell")).toBeVisible();
};

test("four-step tutorial is interactive and can return without wiping the shop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await finishTutorial(page);
  const boardCount = await page.locator("[data-cell]").count();
  await page.getByRole("button", { name: "重新进入新手教学" }).click();
  await expect(page.locator(".tutorial-shell")).toBeVisible();
  await page.getByRole("button", { name: "返回小店" }).click();
  await expect(page.locator(".game-shell")).toBeVisible();
  await expect(page.locator("[data-cell]")).toHaveCount(boardCount);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 568 },
]) {
  test(`main screen stays in one mobile viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await finishTutorial(page);
    const layout = await page.evaluate(() => {
      const rect = (selector: string) => {
        const node = document.querySelector(selector);
        if (!node) return undefined;
        const value = node.getBoundingClientRect();
        return { top: value.top, bottom: value.bottom, left: value.left, right: value.right };
      };
      return {
        appHeight: document.querySelector("#app")?.scrollHeight ?? 0,
        bodyHeight: document.body.scrollHeight,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        board: rect(".board"),
        generators: rect(".mobile-tools"),
        navigation: rect(".mobile-tabbar"),
        pageWidth: document.documentElement.scrollWidth,
      };
    });

    expect(layout.pageWidth).toBe(viewport.width);
    expect(layout.appHeight).toBe(viewport.height);
    expect(layout.bodyHeight).toBe(viewport.height);
    expect(layout.board?.left).toBeGreaterThanOrEqual(0);
    expect(layout.board?.right).toBeLessThanOrEqual(viewport.width);
    expect(layout.generators?.bottom).toBeLessThanOrEqual(viewport.height);
    expect(layout.navigation?.bottom).toBeLessThanOrEqual(viewport.height);
  });
}

test("order shortage opens the atlas and points to the source generator", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await finishTutorial(page);
  await page.locator('[data-sheet="orders"]').click();
  await page.locator('[data-sheet-panel="orders"] [data-atlas-item="egg_2"]').click();
  await expect(page.locator('[data-sheet-panel="atlas"]')).toBeVisible();
  await expect(page.locator('[data-sheet-panel="atlas"] .atlas-section h3')).toContainText("双黄蛋");
  await page.locator('[data-sheet-panel="atlas"] [data-guide-source="egg_2"]').click();
  await expect(page.locator('[data-sheet-panel="atlas"]')).toBeHidden();
  await expect(page.locator('.mobile-tools [data-generator="veg_basket"]')).toHaveClass(/guided/);
});
