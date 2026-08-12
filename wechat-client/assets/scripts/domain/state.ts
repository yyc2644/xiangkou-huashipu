import {
  generatorById,
  generators,
  itemById,
  orderById,
  orders,
  recipeById,
  recipes,
  shopUpgrades,
  customerById,
} from "./catalog";
import {
  dailyTaskById,
  isDailyTaskDone,
  isOnboardingTaskDone,
  isTaskRewardClaimed,
  onboardingTasks,
  taskDayKey,
} from "./dayTasks";
import type {
  BoardItem,
  CookerId,
  GameState,
  GeneratorId,
  ItemId,
  OrderId,
  RecipeDef,
  ShopAreaId,
  MilestoneId,
  DailyTaskId,
  GameRuntime,
  TaskScope,
} from "./types";

const BOARD_SIZE = 63;
const ENERGY_RECOVERY_MS = 3 * 60 * 1000;
const TUTORIAL_SIZE = 16;
const TUTORIAL_BOARDS: Array<Array<ItemId | null>> = [
  ["greens_1", "greens_1", null, null, "tomato_1", null, "egg_1", null, null, "wheat_1", null, null, null, null, null, null],
  ["greens_2", null, null, null, "tomato_1", "tomato_1", null, null, null, "wheat_1", null, null, null, null, null, null],
  ["greens_2", "egg_2", null, null, "tomato_1", "wheat_1", "wheat_1", null, null, null, "daisy_1", null, null, null, null, null],
  ["greens_2", "egg_2", "wheat_2", "daisy_1", "box_1", "ribbon_1", null, null, null, null, null, null, null, null, null, null],
];

const createTutorialBoard = (step: number) =>
  (TUTORIAL_BOARDS[Math.max(0, Math.min(TUTORIAL_BOARDS.length - 1, step))] ?? [])
    .slice(0, TUTORIAL_SIZE)
    .map((itemId, index) => (itemId ? { uid: `tutorial-${step}-${index}`, itemId } : null));

export const createInitialState = (startedAt: number): GameState => {
  const board = Array<BoardItem | null>(BOARD_SIZE).fill(null);
  const starters: ItemId[] = [
    "greens_1",
    "greens_1",
    "tomato_1",
    "egg_1",
    "wheat_1",
    "daisy_1",
    "box_1",
    "ribbon_1",
  ];

  starters.forEach((itemId, index) => {
    board[index] = { uid: `item-${index + 1}`, itemId };
  });

  return {
    saveVersion: 5,
    nextUid: starters.length + 1,
    board,
    generators: {
      veg_basket: { id: "veg_basket", charges: 20, readyAt: startedAt },
      flower_basket: { id: "flower_basket", charges: 16, readyAt: startedAt },
      market_crate: { id: "market_crate", charges: 14, readyAt: startedAt },
    },
    cookers: {
      steamer: { id: "steamer" },
      pan: { id: "pan" },
      gift_table: { id: "gift_table" },
    },
    activeOrders: ["order_001", "order_002"],
    completedOrders: [],
    viewedStories: [],
    shop: {
      signboard: 1,
      tables: 1,
      flower_shelf: 1,
      kitchen: 1,
    },
    coins: 260,
    energy: 80,
    maxEnergy: 80,
    xp: 0,
    level: 1,
    storyPoints: 0,
    lastEnergyAt: startedAt,
    message: "林阿姨推开门：先从一份热腾腾的早餐开始吧。",
    trackedTaskId: "take_material",
    trackedTaskScope: "onboarding",
    claimedTaskIds: [],
    dayKey: taskDayKey(startedAt),
    dailyProgress: { materials: 0, merges: 0, orders: 0 },
    dailyClaimedTaskIds: [],
    tutorial: {
      step: 0,
      open: true,
      completed: false,
      board: createTutorialBoard(0),
      actionDone: false,
    },
    milestones: {},
  };
};

const clone = (state: GameState): GameState => ({
  ...state,
  board: state.board.map((item) => (item ? { ...item } : null)),
  generators: {
    veg_basket: { ...state.generators.veg_basket },
    flower_basket: { ...state.generators.flower_basket },
    market_crate: { ...state.generators.market_crate },
  },
  cookers: {
    steamer: { ...state.cookers.steamer },
    pan: { ...state.cookers.pan },
    gift_table: { ...state.cookers.gift_table },
  },
  activeOrders: [...state.activeOrders],
  completedOrders: [...state.completedOrders],
  viewedStories: [...state.viewedStories],
  shop: { ...state.shop },
  trackedTaskId: state.trackedTaskId,
  claimedTaskIds: [...(state.claimedTaskIds ?? [])],
  dailyProgress: { ...state.dailyProgress },
  dailyClaimedTaskIds: [...state.dailyClaimedTaskIds],
  tutorial: state.tutorial
    ? {
        ...state.tutorial,
        board: state.tutorial.board?.map((item) => (item ? { ...item } : null)),
      }
    : undefined,
  milestones: { ...(state.milestones ?? {}) },
  pendingStory: state.pendingStory ? { ...state.pendingStory } : undefined,
});

const allocateUid = (state: GameState) => `item-${state.nextUid++}`;

const markMilestone = (state: GameState, milestone: MilestoneId) => {
  state.milestones = { ...(state.milestones ?? {}), [milestone]: true };
};

const firstEmpty = (board: Array<BoardItem | null>) => board.findIndex((cell) => !cell);

const addItem = (state: GameState, itemId: ItemId): boolean => {
  const index = firstEmpty(state.board);
  if (index === -1) {
    state.message = "棋盘满了，先合成或出售一些低级物品。";
    return false;
  }

  state.board[index] = { uid: allocateUid(state), itemId };
  return true;
};

const increaseDailyProgress = (state: GameState, field: keyof GameState["dailyProgress"]) => {
  state.dailyProgress = { ...state.dailyProgress, [field]: state.dailyProgress[field] + 1 };
};

const refreshDailyTasks = (state: GameState, currentTime: number) => {
  const nextDay = taskDayKey(currentTime);
  if (state.dayKey === nextDay) return false;
  state.dayKey = nextDay;
  state.dailyProgress = { materials: 0, merges: 0, orders: 0 };
  state.dailyClaimedTaskIds = [];
  if (onboardingTasks.every((task) => isTaskRewardClaimed(state, task.id, "onboarding"))) {
    state.trackedTaskScope = "daily";
    state.trackedTaskId = "daily_materials";
  }
  state.message = "新一天开张了，今日委托已刷新。";
  return true;
};

const removeItems = (state: GameState, needs: ItemId[]): boolean => {
  const indices: number[] = [];

  for (const need of needs) {
    const index = state.board.findIndex((item, cell) => item?.itemId === need && !indices.includes(cell));
    if (index === -1) return false;
    indices.push(index);
  }

  indices.forEach((index) => {
    state.board[index] = null;
  });
  return true;
};

export const countBoardItem = (state: GameState, itemId: ItemId) =>
  state.board.filter((item) => item?.itemId === itemId).length;

export const hasItems = (state: GameState, needs: ItemId[]) =>
  needs.every((need, index) => countBoardItem(state, need) >= needs.slice(0, index + 1).filter((item) => item === need).length);

export const tickState = (state: GameState, currentTime: number): GameState => {
  let changed = false;
  const next = clone(state);

  changed = refreshDailyTasks(next, currentTime) || changed;

  if (next.energy < next.maxEnergy) {
    const gained = Math.floor((currentTime - next.lastEnergyAt) / ENERGY_RECOVERY_MS);
    if (gained > 0) {
      next.energy = Math.min(next.maxEnergy, next.energy + gained);
      next.lastEnergyAt += gained * ENERGY_RECOVERY_MS;
      changed = true;
    }
  } else if (next.lastEnergyAt !== currentTime) {
    next.lastEnergyAt = currentTime;
    changed = true;
  }

  for (const generator of generators) {
    const genState = next.generators[generator.id];
    if (genState.charges <= 0 && currentTime >= genState.readyAt) {
      genState.charges = Math.ceil(generator.maxCharges / 2);
      next.message = `${generator.name}补好货了，可以继续取材。`;
      changed = true;
    }
  }

  return changed ? next : state;
};

export const useGenerator = (state: GameState, generatorId: GeneratorId, runtime: GameRuntime): GameState => {
  const next = clone(state);
  const genDef = generatorById[generatorId];
  const genState = next.generators[generatorId];

  if (next.energy <= 0) {
    next.message = "体力不够了，可以稍等恢复，或在正式版看激励广告补充。";
    return next;
  }

  if (genState.charges <= 0) {
    const remaining = Math.max(0, Math.ceil((genState.readyAt - runtime.nowMs) / 1000));
    next.message = remaining > 0 ? `${genDef.name}还要 ${remaining} 秒补货。` : `${genDef.name}正在补货。`;
    return next;
  }

  const drop = genDef.drops[Math.floor(runtime.random() * genDef.drops.length)];
  if (!addItem(next, drop)) return next;

  markMilestone(next, "take_material");
  increaseDailyProgress(next, "materials");
  next.guidedGeneratorId = undefined;
  if (next.energy === next.maxEnergy) next.lastEnergyAt = runtime.nowMs;
  next.energy -= 1;
  genState.charges -= 1;
  if (genState.charges === 0) {
    genState.readyAt = runtime.nowMs + genDef.cooldownMs;
  }
  next.message = `${genDef.name}产出了 ${itemById[drop].name}。`;
  return next;
};

export const selectOrMoveCell = (state: GameState, index: number): GameState => {
  const next = clone(state);
  const selected = next.selectedCell;

  if (selected === undefined) {
    if (next.board[index]) {
      next.selectedCell = index;
      next.message = `选中了 ${itemById[next.board[index]!.itemId].name}。`;
    }
    return next;
  }

  if (selected === index) {
    next.selectedCell = undefined;
    return next;
  }

  return moveOrMerge(next, selected, index);
};

export const moveOrMerge = (state: GameState, from: number, to: number): GameState => {
  const next = clone(state);
  const source = next.board[from];
  const target = next.board[to];

  if (!source) {
    next.selectedCell = undefined;
    return next;
  }

  if (!target) {
    next.board[to] = source;
    next.board[from] = null;
    next.selectedCell = undefined;
    next.message = `移动了 ${itemById[source.itemId].name}。`;
    return next;
  }

  if (source.itemId === target.itemId && itemById[source.itemId].next) {
    const upgraded = itemById[source.itemId].next!;
    next.board[to] = { uid: allocateUid(next), itemId: upgraded };
    next.board[from] = null;
    next.selectedCell = undefined;
    increaseDailyProgress(next, "merges");
    next.message = `${itemById[source.itemId].name} 合成了 ${itemById[upgraded].name}。`;
    if (upgraded === "greens_2") {
      markMilestone(next, "merge_greens");
    }
    return next;
  }

  next.selectedCell = to;
  next.message = "这两个物品不能合成。";
  return next;
};

export const sellCell = (state: GameState, index: number): GameState => {
  const next = clone(state);
  const item = next.board[index];
  if (!item) return next;

  const def = itemById[item.itemId];
  next.board[index] = null;
  next.coins += def.sell;
  next.selectedCell = undefined;
  next.message = `出售 ${def.name}，获得 ${def.sell} 金币。`;
  return next;
};

export const startRecipe = (state: GameState, recipeId: string, currentTime: number): GameState => {
  const recipe = recipeById[recipeId];
  const next = clone(state);
  const cooker = next.cookers[recipe.cooker];

  if (cooker.recipeId) {
    next.message = "制作台正忙，等完成后再开新单。";
    return next;
  }

  if (!hasItems(next, recipe.inputs)) {
    next.message = `${recipe.name} 材料还没凑齐。`;
    return next;
  }

  removeItems(next, recipe.inputs);
  cooker.recipeId = recipe.id;
  cooker.readyAt = currentTime + recipe.durationMs;
  cooker.output = recipe.output;
  next.guidedRecipeId = undefined;
  next.message = `${recipe.name} 开始制作，等香气出来就能收取。`;
  if (recipe.id === "recipe_bao") {
    markMilestone(next, "start_bao");
  }
  return next;
};

export const collectCooker = (state: GameState, cookerId: CookerId, currentTime: number): GameState => {
  const next = clone(state);
  const cooker = next.cookers[cookerId];

  if (!cooker.recipeId || !cooker.output || !cooker.readyAt) {
    next.message = "这个制作台现在是空的。";
    return next;
  }

  if (currentTime < cooker.readyAt) {
    next.message = "还没做好，可以稍等，正式版这里会接激励广告加速。";
    return next;
  }

  if (!addItem(next, cooker.output)) return next;

  const recipe = recipeById[cooker.recipeId];
  next.cookers[cookerId] = { id: cookerId };
  next.message = `${recipe.name} 做好了，已经放到棋盘上。`;
  if (recipe.output === "dish_bao") {
    markMilestone(next, "collect_bao");
  }
  return next;
};

const nextOrderId = (state: GameState): OrderId | undefined => {
  return orders.find((order) => !state.activeOrders.includes(order.id) && !state.completedOrders.includes(order.id))?.id;
};

export const submitOrder = (state: GameState, orderId: OrderId): GameState => {
  const order = orderById[orderId];
  const next = clone(state);

  if (!order || !next.activeOrders.includes(orderId)) {
    next.message = "这张订单还没有接到，先完成当前订单吧。";
    return next;
  }

  if (!hasItems(next, order.needs)) {
    next.message = "订单物品还没准备好。";
    return next;
  }

  removeItems(next, order.needs);
  next.coins += order.coin;
  next.xp += order.xp;
  next.storyPoints += order.storyPoints;
  next.completedOrders.push(order.id);
  next.activeOrders = next.activeOrders.filter((id) => id !== order.id);
  increaseDailyProgress(next, "orders");

  if (order.id === "order_001") {
    markMilestone(next, "complete_breakfast");
  }
  if (order.id === "order_007") {
    markMilestone(next, "complete_bao_story");
  }

  if (order.story) {
    const storyKey = `${order.customerId}:${order.id}`;
    const customerStoryCount = next.completedOrders.filter((id) => orderById[id]?.customerId === order.customerId && orderById[id]?.story).length;
    const storyLine = customerById[order.customerId]?.story[Math.max(0, Math.min(2, customerStoryCount - 1))];
    next.pendingStory = {
      orderId: order.id,
      customerId: order.customerId,
      chapter: Math.max(1, Math.min(3, customerStoryCount)),
      line: storyLine ?? "谢谢你，这份心意我收到了。",
    };
    if (!next.viewedStories.includes(storyKey)) {
      next.viewedStories.push(storyKey);
    }
  }

  const replacement = nextOrderId(next);
  if (replacement && next.activeOrders.length < 4) {
    next.activeOrders.push(replacement);
  }

  const leveled = Math.floor(next.xp / 100) + 1;
  if (leveled > next.level) {
    next.level = leveled;
    next.energy = next.maxEnergy;
    next.message = `完成「${order.title}」，小店等级升到 ${next.level}，体力回满了。`;
  } else {
    next.message = `完成「${order.title}」，获得 ${order.coin} 金币。`;
  }

  return next;
};

export const upgradeShop = (state: GameState, areaId: ShopAreaId): GameState => {
  const next = clone(state);
  const current = next.shop[areaId];
  const area = shopUpgrades.find((item) => item.id === areaId);
  const target = area?.levels.find((level) => level.level === current + 1);

  if (!area || !target) {
    next.message = "这个区域已经是 MVP 最高级了。";
    return next;
  }

  if (next.coins < target.coinCost || next.storyPoints < target.storyCost) {
    next.message = `升级${area.name}需要 ${target.coinCost} 金币和 ${target.storyCost} 故事点。`;
    return next;
  }

  next.coins -= target.coinCost;
  next.storyPoints -= target.storyCost;
  next.shop[areaId] = target.level;
  next.message = `${area.name}升级为「${target.title}」：${target.effect}`;
  if (areaId === "signboard" && target.level >= 2) {
    markMilestone(next, "upgrade_signboard");
  }
  return next;
};

export const addEnergyReward = (state: GameState): GameState => {
  const next = clone(state);
  next.energy = Math.min(next.maxEnergy, next.energy + 30);
  next.message = "激励广告完成：体力 +30。";
  return next;
};

export const accelerateCooker = (state: GameState, cookerId: CookerId, currentTime: number): GameState => {
  const next = clone(state);
  const cooker = next.cookers[cookerId];
  if (!cooker.recipeId || !cooker.readyAt) {
    next.message = "这个制作台现在不需要加速。";
    return next;
  }
  cooker.readyAt = currentTime - 1;
  next.message = "激励广告完成，制作已经可以收取。";
  return next;
};

export const trackTask = (state: GameState, taskId: string, scope: TaskScope = "onboarding"): GameState => {
  const next = clone(state);
  next.trackedTaskId = taskId;
  next.trackedTaskScope = scope;
  next.message = "已更新追踪任务。";
  return next;
};

export const claimTaskReward = (state: GameState, taskId: string, scope: TaskScope = "onboarding"): GameState => {
  const task = scope === "onboarding" ? onboardingTasks.find((item) => item.id === taskId) : dailyTaskById[taskId as DailyTaskId];
  const next = clone(state);

  if (!task) {
    next.message = "这个任务不存在。";
    return next;
  }

  const done = scope === "onboarding" ? isOnboardingTaskDone(next, taskId) : isDailyTaskDone(next, taskId as DailyTaskId);
  if (!done) {
    next.message = "任务还没完成，先按追踪目标做一步。";
    return next;
  }

  if (isTaskRewardClaimed(next, taskId, scope)) {
    next.message = "这个任务奖励已经领过了。";
    return next;
  }

  const reward = task.reward;
  next.coins += reward.coins ?? 0;
  next.energy = Math.min(next.maxEnergy, next.energy + (reward.energy ?? 0));
  next.xp += reward.xp ?? 0;
  next.storyPoints += reward.storyPoints ?? 0;
  next.level = Math.floor(next.xp / 100) + 1;
  if (scope === "onboarding") {
    next.claimedTaskIds = [...(next.claimedTaskIds ?? []), taskId];
    if (onboardingTasks.every((item) => isTaskRewardClaimed(next, item.id, "onboarding"))) {
      next.trackedTaskScope = "daily";
      next.trackedTaskId = "daily_materials";
    }
  } else {
    next.dailyClaimedTaskIds = [...next.dailyClaimedTaskIds, taskId as DailyTaskId];
  }
  next.message = `领取「${task.title}」奖励：${task.rewardLabel}。`;
  return next;
};

export const selectTutorialCell = (state: GameState, index: number): GameState => {
  const next = clone(state);
  const tutorial = next.tutorial ?? { step: 0, open: true, completed: false };
  const board = tutorial.board?.length === TUTORIAL_SIZE ? tutorial.board : createTutorialBoard(tutorial.step);
  const selected = tutorial.selectedCell;

  if (selected === undefined) {
    if (board[index]) {
      next.tutorial = { ...tutorial, board, selectedCell: index };
      next.message = `选中了 ${itemById[board[index]!.itemId].name}。`;
    }
    return next;
  }

  if (selected === index) {
    next.tutorial = { ...tutorial, board, selectedCell: undefined };
    return next;
  }

  const source = board[selected];
  const target = board[index];
  if (!source) {
    next.tutorial = { ...tutorial, board, selectedCell: undefined };
    return next;
  }

  if (!target) {
    board[index] = source;
    board[selected] = null;
    next.tutorial = { ...tutorial, board, selectedCell: undefined };
    next.message = `移动了 ${itemById[source.itemId].name}。`;
    return next;
  }

  if (source.itemId === target.itemId && itemById[source.itemId].next) {
    const upgraded = itemById[source.itemId].next!;
    board[index] = { uid: allocateUid(next), itemId: upgraded };
    board[selected] = null;
    next.tutorial = { ...tutorial, board, selectedCell: undefined, actionDone: true };
    next.message = `${itemById[source.itemId].name} 合成了 ${itemById[upgraded].name}。`;
    return next;
  }

  next.tutorial = { ...tutorial, board, selectedCell: index };
  next.message = "这两个材料不能合成，换一组相同的试试。";
  return next;
};

export const useTutorialGenerator = (state: GameState): GameState => {
  const next = clone(state);
  const tutorial = next.tutorial ?? { step: 1, open: true, completed: false };
  const board = tutorial.board?.length === TUTORIAL_SIZE ? tutorial.board : createTutorialBoard(tutorial.step);
  const index = board.findIndex((cell) => !cell);

  if (index === -1) {
    next.tutorial = { ...tutorial, board, actionDone: true };
    next.message = "教学棋盘满了，可以先合成或继续下一步。";
    return next;
  }

  board[index] = { uid: allocateUid(next), itemId: "greens_1" };
  next.tutorial = { ...tutorial, board, selectedCell: undefined, actionDone: true };
  next.message = "菜篮产出了一片菜叶。";
  return next;
};

export const confirmTutorialOrder = (state: GameState): GameState => {
  const next = clone(state);
  const tutorial = next.tutorial ?? { step: 2, open: true, completed: false };
  next.tutorial = { ...tutorial, actionDone: true, selectedCell: undefined };
  next.message = "已追踪街坊早餐，正式游戏里订单会放在入口里。";
  return next;
};

export const setTutorialStep = (state: GameState, step: number): GameState => {
  const next = clone(state);
  const nextStep = Math.max(0, Math.min(3, step));
  next.tutorial = {
    step: nextStep,
    open: true,
    completed: false,
    board: createTutorialBoard(nextStep),
    selectedCell: undefined,
    actionDone: nextStep === 3,
    resumeAvailable: next.tutorial?.resumeAvailable,
  };
  return next;
};

export const closeTutorial = (state: GameState): GameState => {
  const next = clone(state);
  next.tutorial = {
    step: next.tutorial?.step ?? 0,
    open: false,
    completed: next.tutorial?.completed ?? false,
  };
  next.message = "新手提示已收起，右上角 ? 可以随时重新打开。";
  return next;
};

export const completeTutorial = (state: GameState): GameState => {
  const next = clone(state);
  next.tutorial = {
    step: 3,
    open: false,
    completed: true,
    board: createTutorialBoard(3),
    selectedCell: undefined,
    actionDone: true,
    resumeAvailable: false,
  };
  next.selectedCell = undefined;
  next.message = "教学完成，正式开张。先从街坊早餐开始吧。";
  return next;
};

export const restartTutorial = (state: GameState): GameState => {
  const next = clone(state);
  next.tutorial = {
    step: 0,
    open: true,
    completed: false,
    board: createTutorialBoard(0),
    selectedCell: undefined,
    actionDone: false,
    resumeAvailable: true,
  };
  next.selectedCell = undefined;
  next.message = "重新进入新手教学。";
  return next;
};

export const returnToShop = (state: GameState): GameState => {
  const next = clone(state);
  if (!next.tutorial?.resumeAvailable) return next;
  next.tutorial = { ...next.tutorial, completed: true, open: false, selectedCell: undefined };
  next.message = "已回到小店，原有进度没有变化。";
  return next;
};

export const openTutorial = (state: GameState): GameState => {
  const next = clone(state);
  next.tutorial = {
    step: next.tutorial?.step ?? 0,
    open: true,
    completed: next.tutorial?.completed ?? false,
  };
  next.message = "新手提示已打开，可以按自己的节奏查看。";
  return next;
};

export const dismissStory = (state: GameState): GameState => {
  const next = clone(state);
  next.pendingStory = undefined;
  return next;
};

export const completeRecipeImmediately = (state: GameState, recipe: RecipeDef, currentTime: number): GameState => {
  const next = startRecipe(state, recipe.id, currentTime);
  const cooker = next.cookers[recipe.cooker];
  if (cooker.recipeId) {
    cooker.readyAt = currentTime - 1;
    next.message = `${recipe.name} 已通过模拟广告加速完成，可以收取。`;
  }
  return next;
};

export const focusAtlasItem = (state: GameState, itemId: ItemId): GameState => {
  const next = clone(state);
  next.atlasFocusItemId = itemId;
  next.message = `已定位「${itemById[itemId].name}」的来源。`;
  return next;
};

export const guideMaterialSource = (state: GameState, itemId: ItemId): GameState => {
  const next = clone(state);
  const recipe = recipes.find((item) => item.output === itemId);
  next.atlasFocusItemId = itemId;
  next.guidedGeneratorId = undefined;
  next.guidedRecipeId = undefined;

  if (recipe) {
    next.guidedRecipeId = recipe.id;
    next.message = `已定位${recipe.name}和${recipe.cooker === "steamer" ? "蒸锅" : recipe.cooker === "pan" ? "煎台" : "礼盒台"}。`;
    return next;
  }

  const item = itemById[itemId];
  const baseItem = Object.values(itemById).find((candidate) => candidate.chain === item.chain && candidate.level === 1);
  const generator = generators.find((candidate) => baseItem && candidate.drops.includes(baseItem.id));
  if (generator) {
    next.guidedGeneratorId = generator.id;
    next.message = `已定位${generator.name}，从这里开始取材。`;
  } else {
    next.message = "这个材料暂时没有可用来源。";
  }
  return next;
};
