import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const sourceDir = new URL("../src/game/", import.meta.url);
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "huashipu-game-"));

const gameModules = ["types", "catalog", "dayTasks", "state", "save"];
for (const name of gameModules) {
  const source = fs.readFileSync(new URL(`${name}.ts`, sourceDir), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  const rewritten = compiled.replace(/from\s+"\.\/([^"]+)"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(tmpDir, `${name}.mjs`), rewritten);
}

const stateModule = await import(pathToFileUrl(path.join(tmpDir, "state.mjs")));
const catalogModule = await import(pathToFileUrl(path.join(tmpDir, "catalog.mjs")));
const saveModule = await import(pathToFileUrl(path.join(tmpDir, "save.mjs")));

const {
  createInitialState,
  selectTutorialCell,
  useTutorialGenerator,
  confirmTutorialOrder,
  setTutorialStep,
  completeTutorial,
  returnToShop,
  restartTutorial,
  moveOrMerge,
  submitOrder,
  startRecipe,
  collectCooker,
  upgradeShop,
  hasItems,
  claimTaskReward,
  tickState,
  useGenerator,
} = stateModule;
const { migrateGame } = saveModule;
const { orderById, recipes } = catalogModule;

const checkResults = [];
const check = (name, passed, detail = undefined) => {
  checkResults.push({ name, passed, detail });
};

const placeItem = (state, itemId) => {
  const index = state.board.findIndex((cell) => !cell);
  if (index === -1) throw new Error(`Board full while placing ${itemId}`);
  state.board[index] = { uid: `test-${itemId}-${index}`, itemId };
  return index;
};

const placeNeeds = (state, needs) => {
  for (const itemId of needs) placeItem(state, itemId);
};

const completeOrderWithPlacedNeeds = (state, orderId) => {
  const order = orderById[orderId];
  if (!order) throw new Error(`Unknown order ${orderId}`);
  placeNeeds(state, order.needs);
  return submitOrder(state, orderId);
};

const NOW = 1_735_689_600_000;
const runtime = { nowMs: NOW, random: () => 0 };
let state = createInitialState(NOW);
check("新档打开 4 步教程", state.tutorial?.open === true && state.tutorial.step === 0 && state.tutorial.completed === false, state.tutorial);

state = selectTutorialCell(state, 0);
state = selectTutorialCell(state, 1);
check("教程第 1 步可实际合成小青菜", state.tutorial?.actionDone === true && state.tutorial.board?.some((item) => item?.itemId === "greens_2"), {
  actionDone: state.tutorial?.actionDone,
  board: state.tutorial?.board?.map((item) => item?.itemId ?? null),
});

state = setTutorialStep(state, 1);
state = useTutorialGenerator(state);
check("教程第 2 步可实际取材", state.tutorial?.actionDone === true && state.tutorial.board?.some((item) => item?.itemId === "greens_1"), {
  actionDone: state.tutorial?.actionDone,
});

state = setTutorialStep(state, 2);
state = confirmTutorialOrder(state);
check("教程第 3 步可确认街坊早餐", state.tutorial?.actionDone === true && state.message.includes("街坊早餐"), {
  actionDone: state.tutorial?.actionDone,
  message: state.message,
});

state = completeTutorial(state);
check("完成教程进入正式棋盘", state.tutorial?.completed === true && state.tutorial.open === false && state.board.length === 63, {
  tutorial: state.tutorial,
  boardSize: state.board.length,
});

const inactiveProbe = structuredClone(state);
placeItem(inactiveProbe, "dish_bao");
const inactiveSubmit = submitOrder(inactiveProbe, "order_007");
check("状态层拒绝提交未接到的订单", !inactiveSubmit.completedOrders.includes("order_007") && inactiveSubmit.message.includes("还没有接到"), {
  message: inactiveSubmit.message,
  completedOrders: inactiveSubmit.completedOrders,
});

const earlyClaim = claimTaskReward(structuredClone(state), "merge_greens");
check("未完成任务不能提前领奖", !earlyClaim.claimedTaskIds?.includes("merge_greens") && earlyClaim.message.includes("任务还没完成"), {
  message: earlyClaim.message,
  claimedTaskIds: earlyClaim.claimedTaskIds,
});

state = moveOrMerge(state, 0, 1);
const claimProbe = claimTaskReward(structuredClone(state), "merge_greens", "onboarding");
const doubleClaimProbe = claimTaskReward(claimProbe, "merge_greens", "onboarding");
check("完成任务可领取且不可重复领取", claimProbe.claimedTaskIds?.includes("merge_greens") && claimProbe.coins === state.coins + 10 && doubleClaimProbe.coins === claimProbe.coins, {
  beforeCoins: state.coins,
  firstClaimCoins: claimProbe.coins,
  secondClaimCoins: doubleClaimProbe.coins,
  claimedTaskIds: doubleClaimProbe.claimedTaskIds,
});
const extraEggIndex = placeItem(state, "egg_1");
state = moveOrMerge(state, 3, extraEggIndex);
check("正式棋盘可完成首单材料", hasItems(state, orderById.order_001.needs), {
  needs: orderById.order_001.needs,
  board: state.board.map((item) => item?.itemId ?? null).slice(0, 12),
});

state = submitOrder(state, "order_001");
check("提交首单后获得金币并补下一单", state.completedOrders.includes("order_001") && state.coins === 340 && state.activeOrders.join(",") === "order_002,order_003", {
  coins: state.coins,
  activeOrders: state.activeOrders,
  completedOrders: state.completedOrders,
});

for (const orderId of ["order_002", "order_003", "order_004", "order_005", "order_006"]) {
  state = completeOrderWithPlacedNeeds(state, orderId);
}
check("完成前 6 单后故事单进入当前订单", state.activeOrders.includes("order_007") && state.completedOrders.includes("order_006"), {
  activeOrders: state.activeOrders,
  completedOrders: state.completedOrders,
});

const baoRecipe = recipes.find((recipe) => recipe.id === "recipe_bao");
placeNeeds(state, baoRecipe.inputs);
state = startRecipe(state, "recipe_bao", NOW);
check("青菜包配方可开始制作", state.cookers.steamer.recipeId === "recipe_bao" && state.cookers.steamer.output === "dish_bao", state.cookers.steamer);
state.cookers.steamer.readyAt = NOW - 1;
state = collectCooker(state, "steamer", NOW);
check("青菜包可收取到棋盘", state.cookers.steamer.recipeId === undefined && state.board.some((item) => item?.itemId === "dish_bao"), {
  cooker: state.cookers.steamer,
});

state = submitOrder(state, "order_007");
check("提交第一故事单后获得故事点和故事弹窗", state.completedOrders.includes("order_007") && state.storyPoints === 1 && state.pendingStory?.orderId === "order_007", {
  storyPoints: state.storyPoints,
  pendingStory: state.pendingStory,
});

const coinsBeforeUpgrade = state.coins;
state = upgradeShop(state, "signboard");
check("完成故事链后可修一次门头", state.shop.signboard === 2 && state.coins === coinsBeforeUpgrade - 300 && state.milestones?.upgrade_signboard === true, {
  shop: state.shop,
  coinsBeforeUpgrade,
  coinsAfterUpgrade: state.coins,
  milestones: state.milestones,
});

let replayState = restartTutorial(structuredClone(state));
replayState = returnToShop(replayState);
check("重玩教程可返回小店且不清空正式进度", replayState.tutorial?.completed === true && replayState.completedOrders.includes("order_007") && replayState.coins === state.coins, {
  tutorial: replayState.tutorial,
  completedOrders: replayState.completedOrders,
  coins: replayState.coins,
});

let dailyState = structuredClone(state);
dailyState.claimedTaskIds = ["take_material", "merge_greens", "complete_breakfast", "start_bao", "complete_bao_story", "upgrade_signboard"];
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
dailyState = useGenerator(dailyState, "veg_basket", runtime);
check("每日委托按真实取材次数累计", dailyState.dailyProgress.materials === 8, dailyState.dailyProgress);
const earlyDailyClaim = claimTaskReward(dailyState, "daily_materials", "daily");
const claimedDaily = claimTaskReward(earlyDailyClaim, "daily_materials", "daily");
check("每日委托不可重复领取", earlyDailyClaim.dailyClaimedTaskIds.includes("daily_materials") && claimedDaily.energy === earlyDailyClaim.energy, {
  claimed: claimedDaily.dailyClaimedTaskIds,
  energy: claimedDaily.energy,
});
const nextDay = tickState(claimedDaily, NOW + 24 * 60 * 60 * 1000);
check("跨日重置每日进度和领取记录", nextDay.dailyProgress.materials === 0 && nextDay.dailyClaimedTaskIds.length === 0, {
  dayKey: nextDay.dayKey,
  dailyProgress: nextDay.dailyProgress,
  dailyClaimedTaskIds: nextDay.dailyClaimedTaskIds,
});

let energyState = createInitialState(NOW);
energyState = completeTutorial(energyState);
energyState = useGenerator(energyState, "veg_basket", runtime);
const beforeRecovery = tickState(energyState, NOW + 3 * 60 * 1000 - 1);
check("满体力首次取材后不会提前恢复", beforeRecovery.energy === energyState.energy, {
  before: energyState.energy,
  after: beforeRecovery.energy,
  lastEnergyAt: energyState.lastEnergyAt,
});

const legacy = { ...createInitialState(NOW), saveVersion: undefined, nextUid: undefined, dayKey: undefined, dailyProgress: undefined, dailyClaimedTaskIds: undefined };
const migrated = migrateGame(legacy, NOW);
check("v4 存档迁移为 v5 且补齐每日字段", migrated?.saveVersion === 5 && migrated.dayKey && migrated.dailyProgress.materials === 0 && migrated.dailyClaimedTaskIds.length === 0, migrated);

console.table(checkResults.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));

const failed = checkResults.filter((item) => !item.passed);
if (failed.length) {
  console.error("Gameplay loop checks failed:");
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}

function pathToFileUrl(filePath) {
  const resolved = path.resolve(filePath).replace(/\\/g, "/");
  return `file://${resolved.startsWith("/") ? "" : "/"}${resolved}`;
}
