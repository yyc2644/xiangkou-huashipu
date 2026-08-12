import fs from "node:fs";
import ts from "typescript";

const sourceUrl = new URL("../src/game/catalog.ts", import.meta.url);
const source = fs.readFileSync(sourceUrl, "utf8");
const stateSource = fs.readFileSync(new URL("../src/game/state.ts", import.meta.url), "utf8");
const taskSource = fs.readFileSync(new URL("../src/game/dayTasks.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: false,
  },
}).outputText;
const compiledTasks = ts.transpileModule(taskSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: false,
  },
}).outputText;

const catalog = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const taskModule = await import(`data:text/javascript;base64,${Buffer.from(compiledTasks).toString("base64")}`);

const { items, generators, recipes, orders, shopUpgrades } = catalog;
const { dayOneTasks, dailyTasks } = taskModule;
const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
const recipeByOutput = Object.fromEntries(recipes.map((recipe) => [recipe.output, recipe]));

const starterMatch = stateSource.match(/const starters: ItemId\[\] = \[([\s\S]*?)\];/);
const initialBoardItems = starterMatch ? [...starterMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]) : [];
const initialCoinMatch = stateSource.match(/\bcoins:\s*(\d+)/);
const initialCoins = initialCoinMatch ? Number(initialCoinMatch[1]) : 260;

const dropProbabilityByBaseItem = new Map();
for (const generator of generators) {
  const total = generator.drops.length;
  for (const itemId of generator.drops) {
    dropProbabilityByBaseItem.set(itemId, (dropProbabilityByBaseItem.get(itemId) ?? 0) + 1 / total);
  }
}

const levelOneByChain = new Map();
for (const item of items) {
  if (item.level === 1 && item.chain !== "dish" && item.chain !== "gift") {
    levelOneByChain.set(item.chain, item.id);
  }
}

const estimateEnergy = (itemId, stack = []) => {
  if (stack.includes(itemId)) {
    throw new Error(`Circular recipe chain: ${[...stack, itemId].join(" -> ")}`);
  }

  const recipe = recipeByOutput[itemId];
  if (recipe) {
    return recipe.inputs.reduce((sum, input) => sum + estimateEnergy(input, [...stack, itemId]), 0);
  }

  const item = itemById[itemId];
  if (!item) throw new Error(`Unknown item: ${itemId}`);

  const baseItemId = levelOneByChain.get(item.chain);
  const probability = baseItemId ? dropProbabilityByBaseItem.get(baseItemId) : undefined;
  if (!probability) throw new Error(`No generator source for item: ${itemId}`);

  return 2 ** (item.level - 1) / probability;
};

const estimateWaitMs = (itemId, stack = []) => {
  if (stack.includes(itemId)) {
    throw new Error(`Circular recipe chain: ${[...stack, itemId].join(" -> ")}`);
  }

  const recipe = recipeByOutput[itemId];
  if (!recipe) return 0;
  return recipe.durationMs + recipe.inputs.reduce((sum, input) => sum + estimateWaitMs(input, [...stack, itemId]), 0);
};

const format = (value) => Number(value.toFixed(2));
let cumulativeCoins = initialCoins;
let cumulativeXp = 0;
let cumulativeStoryPoints = 0;
let cumulativeEnergy = 0;

const rows = orders.map((order, index) => {
  const energy = order.needs.reduce((sum, itemId) => sum + estimateEnergy(itemId), 0);
  const waitMinutes = order.needs.reduce((sum, itemId) => sum + estimateWaitMs(itemId), 0) / 60000;
  cumulativeCoins += order.coin;
  cumulativeXp += order.xp;
  cumulativeStoryPoints += order.storyPoints;
  cumulativeEnergy += energy;

  return {
    no: index + 1,
    id: order.id,
    title: order.title,
    energy: format(energy),
    waitMin: format(waitMinutes),
    coin: order.coin,
    coinPerEnergy: format(order.coin / energy),
    xp: order.xp,
    storyPoints: order.storyPoints,
    cumulativeCoins,
    cumulativeStoryPoints,
  };
});

const upgradeTotals = shopUpgrades.reduce(
  (totals, area) => {
    for (const level of area.levels) {
      if (level.level <= 1) continue;
      totals.allCoins += level.coinCost;
      totals.allStoryPoints += level.storyCost;
      if (level.level === 2) {
        totals.level2Coins += level.coinCost;
        totals.level2StoryPoints += level.storyCost;
      }
    }
    return totals;
  },
  { level2Coins: 0, level2StoryPoints: 0, allCoins: 0, allStoryPoints: 0 },
);

const taskRewardTotals = dayOneTasks.reduce(
  (totals, task) => {
    totals.coins += task.reward.coins ?? 0;
    totals.energy += task.reward.energy ?? 0;
    totals.xp += task.reward.xp ?? 0;
    totals.storyPoints += task.reward.storyPoints ?? 0;
    return totals;
  },
  { coins: 0, energy: 0, xp: 0, storyPoints: 0 },
);

const dailyRewardTotals = dailyTasks.reduce(
  (totals, task) => {
    totals.coins += task.reward.coins ?? 0;
    totals.energy += task.reward.energy ?? 0;
    totals.xp += task.reward.xp ?? 0;
    totals.storyPoints += task.reward.storyPoints ?? 0;
    return totals;
  },
  { coins: 0, energy: 0, xp: 0, storyPoints: 0 },
);

const baseUnits = (itemId) => {
  const item = itemById[itemId];
  if (!item) throw new Error(`Unknown item: ${itemId}`);
  return 2 ** (item.level - 1);
};

const estimateRemainingEnergyFromBoard = (itemId, requiredQty, boardItems) => {
  const recipe = recipeByOutput[itemId];
  if (recipe) {
    return recipe.inputs.reduce((sum, input) => sum + estimateRemainingEnergyFromBoard(input, requiredQty, boardItems), 0);
  }

  const item = itemById[itemId];
  if (!item) throw new Error(`Unknown item: ${itemId}`);

  const baseItemId = levelOneByChain.get(item.chain);
  const probability = baseItemId ? dropProbabilityByBaseItem.get(baseItemId) : undefined;
  if (!probability) throw new Error(`No generator source for item: ${itemId}`);

  const requiredBaseUnits = baseUnits(itemId) * requiredQty;
  const ownedBaseUnits = boardItems.reduce((sum, ownedId) => {
    const owned = itemById[ownedId];
    if (!owned || owned.chain !== item.chain || owned.level > item.level) return sum;
    return sum + baseUnits(ownedId);
  }, 0);
  return Math.max(0, requiredBaseUnits - ownedBaseUnits) / probability;
};

const countNeeds = (needs) => {
  const map = new Map();
  for (const itemId of needs) map.set(itemId, (map.get(itemId) ?? 0) + 1);
  return [...map.entries()];
};

const firstOrder = orders[0];
const firstStoryOrder = orders.find((order) => order.story);
const firstOrderActualEnergy = firstOrder
  ? countNeeds(firstOrder.needs).reduce((sum, [itemId, qty]) => sum + estimateRemainingEnergyFromBoard(itemId, qty, initialBoardItems), 0)
  : undefined;
const firstOrderWaitMinutes = firstOrder ? firstOrder.needs.reduce((sum, itemId) => sum + estimateWaitMs(itemId), 0) / 60000 : undefined;
const firstStoryRow = firstStoryOrder ? rows.find((row) => row.id === firstStoryOrder.id) : undefined;
const allLevel2ReachRow = rows.find(
  (row) => row.cumulativeCoins >= upgradeTotals.level2Coins && row.cumulativeStoryPoints >= upgradeTotals.level2StoryPoints,
);

const checkResults = [];
const check = (name, passed, detail) => {
  checkResults.push({ name, passed, detail });
};

check("首单实际体力在 3-8", firstOrderActualEnergy !== undefined && firstOrderActualEnergy >= 3 && firstOrderActualEnergy <= 8, {
  firstOrder: firstOrder?.title,
  actualEnergy: firstOrderActualEnergy === undefined ? undefined : format(firstOrderActualEnergy),
  initialBoardItems,
});
check("首单无制作等待", firstOrderWaitMinutes === 0, { waitMin: firstOrderWaitMinutes });
check("第一故事单体力在 25-40", !!firstStoryRow && firstStoryRow.energy >= 25 && firstStoryRow.energy <= 40, firstStoryRow);
check("第一故事单等待不超过 2 分钟", !!firstStoryRow && firstStoryRow.waitMin <= 2, firstStoryRow);
check(
  "普通订单金币/体力在 4-14",
  rows.every((row) => orderById(row.id).story || (row.coinPerEnergy >= 4 && row.coinPerEnergy <= 14)),
  rows.filter((row) => !orderById(row.id).story && (row.coinPerEnergy < 4 || row.coinPerEnergy > 14)),
);
check(
  "故事订单金币/体力在 7-20",
  rows.every((row) => !orderById(row.id).story || (row.coinPerEnergy >= 7 && row.coinPerEnergy <= 20)),
  rows.filter((row) => orderById(row.id).story && (row.coinPerEnergy < 7 || row.coinPerEnergy > 20)),
);
check("制作时间在 90-240 秒", recipes.every((recipe) => recipe.durationMs >= 90_000 && recipe.durationMs <= 240_000), {
  recipes: recipes.map((recipe) => ({ id: recipe.id, seconds: recipe.durationMs / 1000 })),
});
check("全部 2 级装修约第 8 单可达", !!allLevel2ReachRow && allLevel2ReachRow.no >= 7 && allLevel2ReachRow.no <= 9, allLevel2ReachRow);
check(
  "全部 3 级装修不在当前 14 单内完成",
  cumulativeCoins < upgradeTotals.allCoins || cumulativeStoryPoints < upgradeTotals.allStoryPoints,
  { cumulativeCoins, cumulativeStoryPoints, allUpgradeCost: upgradeTotals },
);
check(
  "首日任务奖励不改变故事点节奏",
  taskRewardTotals.storyPoints === 0,
  taskRewardTotals,
);
check(
  "首日任务奖励总量温和",
  taskRewardTotals.coins <= 60 && taskRewardTotals.energy <= 40 && taskRewardTotals.xp <= 20,
  taskRewardTotals,
);
check(
  "每日委托奖励符合回访目标",
  dailyTasks.length === 3 && dailyRewardTotals.coins === 25 && dailyRewardTotals.energy === 12 && dailyRewardTotals.xp === 15 && dailyRewardTotals.storyPoints === 0,
  { tasks: dailyTasks.map((task) => ({ id: task.id, target: task.target, reward: task.reward })), totals: dailyRewardTotals },
);

console.table(rows);
console.log("Totals", {
  initialCoins,
  orderCoins: cumulativeCoins - initialCoins,
  cumulativeCoins,
  cumulativeXp,
  finalLevel: Math.floor(cumulativeXp / 100) + 1,
  cumulativeStoryPoints,
  estimatedEnergy: format(cumulativeEnergy),
});
console.log("Upgrade costs", upgradeTotals);
console.log("Task rewards", taskRewardTotals);
console.log("Daily rewards", dailyRewardTotals);
console.table(checkResults.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));

const failed = checkResults.filter((item) => !item.passed);
if (failed.length) {
  console.error("Balance checks failed:");
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}

function orderById(orderId) {
  return orders.find((order) => order.id === orderId);
}
