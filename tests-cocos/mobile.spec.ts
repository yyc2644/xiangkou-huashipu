import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "xiangkou-huashipu-cocos-v5";
const DESIGN_WIDTH = 390;

const point = (viewport: { width: number; height: number }, designX: number, designY: number) => {
  const scale = viewport.width / DESIGN_WIDTH;
  return {
    x: (DESIGN_WIDTH / 2 + designX) * scale,
    y: viewport.height / 2 - designY * scale,
  };
};

const clickDesign = async (page: Page, viewport: { width: number; height: number }, x: number, y: number) => {
  const target = point(viewport, x, y);
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(180);
};

const finishTutorial = async (page: Page, viewport: { width: number; height: number }) => {
  const visibleHeight = DESIGN_WIDTH * viewport.height / viewport.width;
  const bottom = -visibleHeight / 2;
  await clickDesign(page, viewport, -111, 165);
  await clickDesign(page, viewport, -37, 165);
  await clickDesign(page, viewport, 0, bottom + 88);
  await clickDesign(page, viewport, 0, bottom + 153);
  await clickDesign(page, viewport, 0, bottom + 88);
  await clickDesign(page, viewport, 0, bottom + 153);
  await clickDesign(page, viewport, 0, bottom + 88);
  await clickDesign(page, viewport, 0, bottom + 88);
};

const loadFreshGame = async (page: Page, viewport: { width: number; height: number }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2_500);
  return errors;
};

for (const viewport of [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 568 },
]) {
  test(`Cocos tutorial and main board fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors = await loadFreshGame(page, viewport);
    await finishTutorial(page, viewport);
    await page.waitForFunction((key) => localStorage.getItem(key) !== null, SAVE_KEY);

    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
    const layout = await page.evaluate(() => {
      const canvas = document.querySelector("canvas")?.getBoundingClientRect();
      return {
        bodyWidth: document.documentElement.scrollWidth,
        bodyHeight: document.documentElement.scrollHeight,
        canvas: canvas ? { width: canvas.width, height: canvas.height, bottom: canvas.bottom } : null,
      };
    });

    expect(saved?.schemaVersion).toBe(5);
    expect(saved?.state?.tutorial?.completed).toBe(true);
    expect(saved?.state?.board).toHaveLength(63);
    expect(layout.bodyWidth).toBe(viewport.width);
    expect(layout.bodyHeight).toBe(viewport.height);
    expect(layout.canvas).toEqual({ width: viewport.width, height: viewport.height, bottom: viewport.height });
    expect(errors).toEqual([]);
  });
}

test("Cocos generator saves progress and tutorial replay returns without wiping the shop", async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  const errors = await loadFreshGame(page, viewport);
  await finishTutorial(page, viewport);
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, SAVE_KEY);
  const visibleHeight = DESIGN_WIDTH * viewport.height / viewport.width;
  const bottom = -visibleHeight / 2;

  await clickDesign(page, viewport, -120, bottom + 91);
  let saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
  expect(saved.state.energy).toBe(79);
  expect(saved.state.dailyProgress.materials).toBe(1);
  const boardBeforeReplay = saved.state.board;

  await clickDesign(page, viewport, 168, visibleHeight / 2 - 31);
  await clickDesign(page, viewport, -160, visibleHeight / 2 - 31);
  saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
  expect(saved.state.tutorial.completed).toBe(true);
  expect(saved.state.board).toEqual(boardBeforeReplay);
  expect(errors).toEqual([]);
});

test("Cocos story dialog can be dismissed and persists the closed state", async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  const errors = await loadFreshGame(page, viewport);
  await finishTutorial(page, viewport);
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, SAVE_KEY);
  await page.evaluate((key) => {
    const envelope = JSON.parse(localStorage.getItem(key) ?? "null");
    envelope.state.pendingStory = {
      orderId: "order_007",
      customerId: "lin",
      chapter: 1,
      line: "这家小铺以前一到清晨就有蒸汽。",
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  }, SAVE_KEY);

  await page.reload();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2_500);
  await clickDesign(page, viewport, 0, -64);
  await page.waitForFunction((key) => {
    const envelope = JSON.parse(localStorage.getItem(key) ?? "null");
    return envelope?.state?.pendingStory == null;
  }, SAVE_KEY);

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
  expect(saved.state.pendingStory).toBeUndefined();
  expect(errors).toEqual([]);
});

test("Cocos rewarded paths grant only completed mock ads", async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  const errors = await loadFreshGame(page, viewport);
  await finishTutorial(page, viewport);
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, SAVE_KEY);
  await page.evaluate((key) => {
    const envelope = JSON.parse(localStorage.getItem(key) ?? "null");
    envelope.state.energy = 0;
    localStorage.setItem(key, JSON.stringify(envelope));
  }, SAVE_KEY);
  await page.reload();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2_500);

  const visibleHeight = DESIGN_WIDTH * viewport.height / viewport.width;
  await clickDesign(page, viewport, 137, visibleHeight / 2 - 82);
  await page.waitForFunction((key) => {
    const envelope = JSON.parse(localStorage.getItem(key) ?? "null");
    return envelope?.state?.energy === 30;
  }, SAVE_KEY);

  await page.evaluate((key) => {
    const envelope = JSON.parse(localStorage.getItem(key) ?? "null");
    envelope.state.cookers.steamer = {
      id: "steamer",
      recipeId: "recipe_bao",
      readyAt: Date.now() + 90_000,
      output: "dish_bao",
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  }, SAVE_KEY);
  await page.reload();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2_500);
  const bottom = -visibleHeight / 2;
  await clickDesign(page, viewport, 74, bottom + 27);
  await clickDesign(page, viewport, 132, visibleHeight / 2 - 164);
  await page.waitForFunction((key) => {
    const envelope = JSON.parse(localStorage.getItem(key) ?? "null");
    return envelope?.state?.cookers?.steamer?.readyAt <= Date.now();
  }, SAVE_KEY);

  expect(errors).toEqual([]);
});

test("Cocos craft cooker tabs remain interactive on the smallest viewport", async ({ page }) => {
  const viewport = { width: 320, height: 568 };
  const errors = await loadFreshGame(page, viewport);
  await finishTutorial(page, viewport);
  const visibleHeight = DESIGN_WIDTH * viewport.height / viewport.width;
  const top = visibleHeight / 2;
  const bottom = -visibleHeight / 2;

  await clickDesign(page, viewport, 74, bottom + 27);
  const steamer = await page.locator("canvas").screenshot();
  await clickDesign(page, viewport, 0, top - 116);
  const pan = await page.locator("canvas").screenshot();
  await clickDesign(page, viewport, 112, top - 116);
  const giftTable = await page.locator("canvas").screenshot();
  await clickDesign(page, viewport, 52, top - 154);
  const giftTableSecondPage = await page.locator("canvas").screenshot();

  expect(pan.equals(steamer)).toBe(false);
  expect(giftTable.equals(pan)).toBe(false);
  expect(giftTableSecondPage.equals(giftTable)).toBe(false);
  expect(errors).toEqual([]);
});
