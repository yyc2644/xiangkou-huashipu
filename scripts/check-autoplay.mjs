import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const useCocosDomain = process.argv.includes("--cocos");
const sourceDir = new URL(
  useCocosDomain ? "../wechat-client/assets/scripts/domain/" : "../src/game/",
  import.meta.url,
);
const suiteName = useCocosDomain ? "Cocos production domain" : "Web reference domain";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `huashipu-autoplay-${useCocosDomain ? "cocos" : "web"}-`));

const sourceFiles = ["types", "catalog", "dayTasks", "state", useCocosDomain ? "save-migration" : "save"];
for (const name of sourceFiles) {
  const source = fs.readFileSync(new URL(`${name}.ts`, sourceDir), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  fs.writeFileSync(path.join(tmpDir, `${name}.mjs`), compiled.replace(/from\s+"\.\/([^"]+)"/g, 'from "./$1.mjs"'));
}

const stateModule = await import(pathToFileUrl(path.join(tmpDir, "state.mjs")));
const catalogModule = await import(pathToFileUrl(path.join(tmpDir, "catalog.mjs")));
const taskModule = await import(pathToFileUrl(path.join(tmpDir, "dayTasks.mjs")));

const {
  addEnergyReward,
  claimTaskReward,
  collectCooker,
  completeTutorial,
  createInitialState,
  moveOrMerge,
  startRecipe,
  submitOrder,
  tickState,
  useGenerator,
} = stateModule;
const { dayOneTasks, isDayTaskDone, isTaskRewardClaimed } = taskModule;
const { generators, items, itemById, orderById, orders, recipes, recipeById } = catalogModule;

const BOARD_LIMIT = 63;
const SESSION_COUNT = 100;
const requestedTarget = process.argv.find((argument) => argument.startsWith("--target="))?.split("=")[1];
const TARGET_ORDER_COUNT = requestedTarget === "all"
  ? orders.length
  : Math.min(orders.length, Number.parseInt(requestedTarget ?? "14", 10));
const contentScale = Math.max(1, TARGET_ORDER_COUNT / 14);
const MAX_TAPS_PER_SESSION = Math.ceil(420 * contentScale);
const P90_TAPS_LIMIT = Math.ceil(320 * contentScale);
const MAX_OCCUPIED_LIMIT = 58;
const MAX_ADS_PER_SESSION = Math.ceil(6 * contentScale);
const MAX_COOLDOWN_WAITS = Math.ceil(60 * contentScale);

const itemsByLevel = [...items].sort((a, b) => a.level - b.level);
const recipeByOutput = Object.fromEntries(recipes.map((recipe) => [recipe.output, recipe]));
const baseItemByChain = new Map(items.filter((item) => item.level === 1).map((item) => [item.chain, item.id]));

const mulberry32 = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const countBoardItem = (state, itemId) => state.board.filter((cell) => cell?.itemId === itemId).length;
const occupiedCount = (state) => state.board.filter(Boolean).length;

const countNeeds = (needs) => {
  const map = new Map();
  for (const itemId of needs) map.set(itemId, (map.get(itemId) ?? 0) + 1);
  return map;
};

const reserveWith = (reserve, itemId, quantity) => {
  const next = new Map(reserve);
  next.set(itemId, Math.max(next.get(itemId) ?? 0, quantity));
  return next;
};

const findMergePair = (state, itemId, reserve) => {
  const reserved = reserve.get(itemId) ?? 0;
  const indices = state.board
    .map((cell, index) => (cell?.itemId === itemId ? index : -1))
    .filter((index) => index >= 0);

  return indices.length - reserved >= 2 ? indices.slice(0, 2) : undefined;
};

const compactBoard = (state, reserve, metrics) => {
  let next = state;
  let changed = true;

  while (changed) {
    changed = false;
    for (const item of itemsByLevel) {
      if (!item.next) continue;
      const pair = findMergePair(next, item.id, reserve);
      if (!pair) continue;

      next = moveOrMerge(next, pair[0], pair[1]);
      metrics.merges += 1;
      metrics.maxOccupied = Math.max(metrics.maxOccupied, occupiedCount(next));
      changed = true;
      break;
    }
  }

  return next;
};

const bestGeneratorFor = (itemId) => {
  const item = itemById[itemId];
  const baseItem = item ? baseItemByChain.get(item.chain) : undefined;
  if (!baseItem) throw new Error(`No base item for ${itemId}`);

  const candidates = generators
    .map((generator) => {
      const hits = generator.drops.filter((drop) => drop === baseItem).length;
      return hits ? { id: generator.id, probability: hits / generator.drops.length } : undefined;
    })
    .filter(Boolean)
    .sort((a, b) => b.probability - a.probability);

  if (!candidates.length) throw new Error(`No generator source for ${itemId}`);
  return candidates[0].id;
};

const claimAvailableTasks = (state, metrics) => {
  let next = state;
  for (const task of dayOneTasks) {
    if (!isDayTaskDone(next, task.id) || isTaskRewardClaimed(next, task.id)) continue;
    next = claimTaskReward(next, task.id, "onboarding");
    metrics.claimedTasks += 1;
  }
  return next;
};

const takeFromGenerator = (state, generatorId, metrics, clock) => {
  let next = state;
  let guard = 0;

  while (next.generators[generatorId].charges <= 0) {
    const readyAt = next.generators[generatorId].readyAt ?? clock.now;
    clock.now = Math.max(clock.now, readyAt);
    next = tickState(next, clock.now);
    metrics.cooldownWaits += 1;

    guard += 1;
    if (guard > 20) throw new Error(`Generator ${generatorId} did not recover`);
  }

  if (next.energy <= 0) {
    next = addEnergyReward(next);
    metrics.ads += 1;
  }

  const before = occupiedCount(next);
  next = useGenerator(next, generatorId, { nowMs: clock.now, random: clock.random });
  const after = occupiedCount(next);
  if (after <= before && next.message.includes("棋盘满了")) {
    throw new Error("Board is full while taking material");
  }

  metrics.taps += 1;
  metrics.maxOccupied = Math.max(metrics.maxOccupied, after);
  return claimAvailableTasks(next, metrics);
};

const ensureItem = (state, itemId, quantity, reserve, metrics, clock) => {
  const recipe = recipeByOutput[itemId];
  let next = state;

  if (recipe) {
    while (countBoardItem(next, itemId) < quantity) {
      const recipeReserve = new Map(reserve);
      for (const [input, inputQuantity] of countNeeds(recipe.inputs).entries()) {
        recipeReserve.set(input, Math.max(recipeReserve.get(input) ?? 0, inputQuantity));
      }

      for (const [input, inputQuantity] of countNeeds(recipe.inputs).entries()) {
        next = ensureItem(next, input, inputQuantity, recipeReserve, metrics, clock);
      }

      next = compactBoard(next, recipeReserve, metrics);
      next = startRecipe(next, recipe.id, clock.now);
      if (next.cookers[recipe.cooker].recipeId !== recipe.id) {
        throw new Error(`Could not start recipe ${recipe.id}: ${next.message}`);
      }

      metrics.crafts += 1;
      metrics.craftWaitMinutes += recipe.durationMs / 60000;
      clock.now = Math.max(clock.now, next.cookers[recipe.cooker].readyAt ?? clock.now);
      next.cookers[recipe.cooker].readyAt = clock.now - 1;
      next = collectCooker(next, recipe.cooker, clock.now);
      next = claimAvailableTasks(next, metrics);
      next = compactBoard(next, reserve, metrics);
    }
    return next;
  }

  const generatorId = bestGeneratorFor(itemId);
  let guard = 0;
  while (countBoardItem(next, itemId) < quantity) {
    next = compactBoard(next, reserve, metrics);
    if (countBoardItem(next, itemId) >= quantity) break;
    if (occupiedCount(next) >= BOARD_LIMIT) throw new Error(`Board full before generating ${itemId}`);

    next = takeFromGenerator(next, generatorId, metrics, clock);
    next = compactBoard(next, reserve, metrics);

    guard += 1;
    if (guard > 500) throw new Error(`Could not produce ${quantity}x ${itemId}`);
  }

  return next;
};

const completeOrder = (state, orderId, metrics, clock) => {
  const order = orderById[orderId];
  if (!order) throw new Error(`Unknown order ${orderId}`);
  if (!state.activeOrders.includes(orderId)) throw new Error(`Order ${orderId} is not active`);

  const reserve = countNeeds(order.needs);
  let next = state;
  for (const [itemId, quantity] of reserve.entries()) {
    next = ensureItem(next, itemId, quantity, reserve, metrics, clock);
  }

  next = compactBoard(next, reserve, metrics);
  next = submitOrder(next, orderId);
  next = claimAvailableTasks(next, metrics);

  if (!next.completedOrders.includes(orderId)) {
    throw new Error(`Could not submit ${orderId}: ${next.message}`);
  }

  metrics.ordersCompleted += 1;
  metrics.maxOccupied = Math.max(metrics.maxOccupied, occupiedCount(next));
  return next;
};

const runSession = (seed) => {
  const metrics = {
    seed,
    taps: 0,
    ads: 0,
    cooldownWaits: 0,
    crafts: 0,
    craftWaitMinutes: 0,
    claimedTasks: 0,
    maxOccupied: 0,
    merges: 0,
    ordersCompleted: 0,
  };
  const clock = { now: 1_800_000_000_000 + seed * 1_000, random: mulberry32(seed) };

  try {
    let state = createInitialState(clock.now);
    state = completeTutorial(state);
    metrics.maxOccupied = occupiedCount(state);

    for (const order of orders.slice(0, TARGET_ORDER_COUNT)) {
      state = completeOrder(state, order.id, metrics, clock);
    }

    return {
      ...metrics,
      completedFirstStory: state.completedOrders.includes("order_007"),
      completedAllOrders: orders.slice(0, TARGET_ORDER_COUNT).every((order) => state.completedOrders.includes(order.id)),
      finalEnergy: state.energy,
      finalCoins: state.coins,
      finalStoryPoints: state.storyPoints,
      finalBoardOccupied: occupiedCount(state),
    };
  } finally {
    // Each session owns its seeded runtime; no globals are patched.
  }
};

const percentile = (values, ratio) => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
};

const results = Array.from({ length: SESSION_COUNT }, (_, index) => runSession(index + 1));
const tapValues = results.map((item) => item.taps);
const occupiedValues = results.map((item) => item.maxOccupied);
const adValues = results.map((item) => item.ads);
const cooldownValues = results.map((item) => item.cooldownWaits);

const summary = {
  suite: suiteName,
  sessions: results.length,
  targetOrders: TARGET_ORDER_COUNT,
  completedFirstStory: results.filter((item) => item.completedFirstStory).length,
  completedAllOrders: results.filter((item) => item.completedAllOrders).length,
  tapsAvg: average(tapValues),
  tapsP50: percentile(tapValues, 0.5),
  tapsP90: percentile(tapValues, 0.9),
  tapsMax: Math.max(...tapValues),
  maxBoardOccupied: Math.max(...occupiedValues),
  adsMax: Math.max(...adValues),
  cooldownWaitsMax: Math.max(...cooldownValues),
  craftsMax: Math.max(...results.map((item) => item.crafts)),
};

const checkResults = [];
const check = (name, passed, detail = undefined) => checkResults.push({ name, passed, detail });

check("100 轮均完成首日故事节点第 7 单", summary.completedFirstStory === SESSION_COUNT, {
  completed: summary.completedFirstStory,
  sessions: SESSION_COUNT,
});
check(`100 轮均完成当前 ${TARGET_ORDER_COUNT} 单内容池`, summary.completedAllOrders === SESSION_COUNT, {
  completed: summary.completedAllOrders,
  sessions: SESSION_COUNT,
});
check("单轮取材次数不超过上限", summary.tapsMax <= MAX_TAPS_PER_SESSION, {
  max: summary.tapsMax,
  limit: MAX_TAPS_PER_SESSION,
});
check("P90 取材次数在当前内容池节奏范围内", summary.tapsP90 <= P90_TAPS_LIMIT, {
  p90: summary.tapsP90,
  limit: P90_TAPS_LIMIT,
});
check("棋盘最高占用未接近满格", summary.maxBoardOccupied <= MAX_OCCUPIED_LIMIT, {
  max: summary.maxBoardOccupied,
  limit: MAX_OCCUPIED_LIMIT,
});
check("模拟广告补体力次数可控", summary.adsMax <= MAX_ADS_PER_SESSION, {
  max: summary.adsMax,
  limit: MAX_ADS_PER_SESSION,
});
check("生成器冷却等待次数可控", summary.cooldownWaitsMax <= MAX_COOLDOWN_WAITS, {
  max: summary.cooldownWaitsMax,
  limit: MAX_COOLDOWN_WAITS,
});

console.table(
  results.slice(0, 10).map((item) => ({
    seed: item.seed,
    taps: item.taps,
    ads: item.ads,
    waits: item.cooldownWaits,
    crafts: item.crafts,
    maxCells: item.maxOccupied,
    orders: item.ordersCompleted,
    done: item.completedAllOrders ? "PASS" : "FAIL",
  })),
);
console.log(`${suiteName} autoplay summary`, summary);
console.table(checkResults.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));

const failed = checkResults.filter((item) => !item.passed);
if (failed.length) {
  console.error("Autoplay checks failed:");
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}

function average(values) {
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function pathToFileUrl(filePath) {
  const resolved = path.resolve(filePath).replace(/\\/g, "/");
  return `file://${resolved.startsWith("/") ? "" : "/"}${resolved}`;
}
