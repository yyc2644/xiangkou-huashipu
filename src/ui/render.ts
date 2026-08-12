import {
  cookerNames,
  customerById,
  generators,
  items,
  itemById,
  orderById,
  recipes,
  shopUpgrades,
} from "../game/catalog";
import {
  addEnergyReward,
  claimTaskReward,
  confirmTutorialOrder,
  completeTutorial,
  collectCooker,
  countBoardItem,
  dismissStory,
  focusAtlasItem,
  guideMaterialSource,
  hasItems,
  restartTutorial,
  returnToShop,
  selectOrMoveCell,
  selectTutorialCell,
  sellCell,
  setTutorialStep,
  startRecipe,
  submitOrder,
  trackTask,
  upgradeShop,
  useTutorialGenerator,
  useGenerator,
} from "../game/state";
import {
  claimableDailyTasks,
  claimableOnboardingTasks,
  dailyTasks,
  isTaskDone,
  isTaskRewardClaimed,
  onboardingTasks,
  remainingDailyTasks,
  remainingOnboardingTasks,
  taskProgress,
} from "../game/dayTasks";
import type { BoardItem, GameRuntime, GameState, ItemId, TaskScope } from "../game/types";
import { clearGame } from "../game/save";
import { artIcon } from "./art";

type Commit = (state: GameState) => void;
type RenderUiState = {
  toast: string;
  pulse?: "merge" | "order" | "task";
  runtime: GameRuntime;
};
const shopArtUrl = new URL("../assets/generated/style-reference-shop-runtime.jpg", import.meta.url).href;

const tutorialSteps = [
  {
    title: "第一步：点两个相同材料",
    body: "先点第一片菜叶，再点第二片菜叶。两个相同材料会合成更高一级。",
    tip: "完成操作后才能进入下一步。",
    board: ["greens_1", "greens_1", null, null, "tomato_1", null, "egg_1", null, null, "wheat_1", null, null, null, null, null, null],
    focus: [0, 1],
  },
  {
    title: "第二步：取材进棋盘",
    body: "点一次菜篮，材料会自动落到空格里。正式游戏里每次取材会消耗体力。",
    tip: "取到材料后继续下一步。",
    board: [null, null, "greens_2", null, "tomato_1", "tomato_1", null, null, null, "wheat_1", null, null, null, null, null, null],
    focus: [6],
  },
  {
    title: "第三步：确认订单目标",
    body: "棋盘上发光的是订单需要的材料。点下方这张「街坊早餐」订单卡，确认要追踪这单。",
    tip: "确认后，正式游戏里可以从底部「订单」入口继续提交订单。",
    board: ["greens_2", "egg_2", null, null, "tomato_1", "wheat_1", "wheat_1", null, null, null, "daisy_1", null, null, null, null, null],
    focus: [0, 1],
  },
  {
    title: "第四步：开始经营",
    body: "主屏只放正在操作的内容。订单、任务、图谱和店铺都在底部入口里。",
    tip: "完成教学后进入正式棋盘，从第一单街坊早餐开始。",
    board: ["greens_2", "egg_2", "wheat_2", "daisy_1", "box_1", "ribbon_1", null, null, null, null, null, null, null, null, null, null],
    focus: [0, 1],
  },
];

const html = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

const formatTime = (ms: number) => {
  if (ms <= 0) return "可收取";
  const seconds = Math.ceil(ms / 1000);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return min > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
};

const itemChip = (itemId: ItemId, compact = false) => {
  const item = itemById[itemId];
  return `
    <span class="item-chip ${compact ? "compact" : ""}" style="--chip:${item.color}">
      <span class="item-mark">${artIcon(item.icon, { size: "tiny", label: item.name, color: item.color })}</span>
      <span class="item-name">${html(item.name)}</span>
    </span>
  `;
};

const countNeeds = (needs: ItemId[]) => {
  const map = new Map<ItemId, number>();
  needs.forEach((item) => map.set(item, (map.get(item) ?? 0) + 1));
  return [...map.entries()];
};

const renderNeedList = (state: GameState, needs: ItemId[]) =>
  countNeeds(needs)
    .map(([itemId, qty]) => {
      const owned = countBoardItem(state, itemId);
      const ok = owned >= qty;
      return `
        <div class="need ${ok ? "ok" : ""}">
          ${itemChip(itemId, true)}
          <span>${owned}/${qty}</span>
        </div>
      `;
    })
    .join("");

const sourceGenerators = (itemId: ItemId) =>
  generators.filter((generator) => generator.drops.includes(itemId)).map((generator) => generator.name);

const previousMergeItem = (itemId: ItemId) => items.find((item) => item.next === itemId);

const recipeForOutput = (itemId: ItemId) => recipes.find((recipe) => recipe.output === itemId);

const baseItemFor = (itemId: ItemId): ItemId | undefined => {
  const path = itemPath(itemId);
  return path[0];
};

const bestGenerator = (itemId: ItemId) => {
  const baseItemId = baseItemFor(itemId);
  if (!baseItemId) return undefined;
  const candidates = generators
    .map((generator) => {
      const hits = generator.drops.filter((drop) => drop === baseItemId).length;
      return hits > 0 ? { generator, probability: hits / generator.drops.length } : undefined;
    })
    .filter(Boolean) as Array<{ generator: (typeof generators)[number]; probability: number }>;
  return candidates.sort((a, b) => b.probability - a.probability)[0];
};

const bestGeneratorSource = (itemId: ItemId) => {
  const source = bestGenerator(itemId);
  return source ? { name: source.generator.name, probability: source.probability } : undefined;
};

const formatEnergyEstimate = (value: number | undefined) => {
  if (value === undefined) return "";
  if (value <= 0) return "现有材料可合成";
  const rounded = Math.max(1, Math.ceil(value));
  return `预计还需约 ${rounded} 次取材`;
};

const chainBaseUnits = (itemId: ItemId) => {
  const item = itemById[itemId];
  return item ? 2 ** (item.level - 1) : 0;
};

const estimateRemainingEnergy = (state: GameState, itemId: ItemId, requiredQty = 1): number | undefined => {
  const recipe = recipeForOutput(itemId);
  if (recipe) {
    const inputCosts = recipe.inputs.map((input) => estimateRemainingEnergy(state, input, requiredQty));
    if (inputCosts.some((value) => value === undefined)) return undefined;
    return (inputCosts as number[]).reduce((sum, value) => sum + value, 0);
  }

  const item = itemById[itemId];
  const source = bestGeneratorSource(itemId);
  if (!item || !source) return undefined;

  const requiredBaseUnits = requiredQty * chainBaseUnits(itemId);
  const ownedBaseUnits = state.board.reduce((sum, cell) => {
    if (!cell) return sum;
    const owned = itemById[cell.itemId];
    if (!owned || owned.chain !== item.chain || owned.level > item.level) return sum;
    return sum + chainBaseUnits(cell.itemId);
  }, 0);
  const remainingBaseUnits = Math.max(0, requiredBaseUnits - ownedBaseUnits);
  return remainingBaseUnits / source.probability;
};

const sourceLine = (itemId: ItemId) => {
  const recipe = recipeForOutput(itemId);
  if (recipe) return `${cookerNames[recipe.cooker]}制作，先备齐 ${recipe.inputs.map((input) => itemById[input].name).join(" + ")}`;

  const source = bestGeneratorSource(itemId);
  return source ? `主要来源：${source.name}` : "暂无来源配置";
};

const itemInstruction = (itemId: ItemId) => {
  const item = itemById[itemId];
  const recipe = recipeForOutput(itemId);
  if (recipe) {
    return `在${cookerNames[recipe.cooker]}制作：${recipe.inputs.map((input) => itemById[input].name).join(" + ")}`;
  }

  const previous = previousMergeItem(itemId);
  if (previous) {
    return `由 2 个「${previous.name}」合成`;
  }

  const sources = sourceGenerators(itemId);
  return sources.length ? `从${sources.join(" / ")}取材` : `${item.name} 暂无来源配置`;
};

const itemPath = (itemId: ItemId): ItemId[] => {
  const path: ItemId[] = [];
  let current: ItemId | undefined = itemId;
  while (current) {
    path.unshift(current);
    const previous = previousMergeItem(current);
    current = previous?.id;
  }
  return path;
};

const estimateShortageEnergy = (state: GameState, itemId: ItemId, shortage?: { required: number; missing: number }) => {
  if (!shortage) return estimateRemainingEnergy(state, itemId, 1);
  return recipeForOutput(itemId)
    ? estimateRemainingEnergy(state, itemId, shortage.missing)
    : estimateRemainingEnergy(state, itemId, shortage.required);
};

const renderPathMeta = (state: GameState, itemId: ItemId, shortage?: { required: number; owned: number; missing: number }) => {
  const estimate = formatEnergyEstimate(estimateShortageEnergy(state, itemId, shortage));
  const shortageText = shortage ? `已有 ${shortage.owned}/${shortage.required}，还差 ${shortage.missing}` : undefined;
  return `
    <div class="path-meta">
      ${shortageText ? `<span>${html(shortageText)}</span>` : ""}
      <span>${html(sourceLine(itemId))}</span>
      ${estimate ? `<span>${html(estimate)}</span>` : ""}
    </div>
  `;
};

const renderPath = (state: GameState, itemId: ItemId, shortage?: { required: number; owned: number; missing: number }) => {
  const recipe = recipeForOutput(itemId);
  const source = bestGenerator(itemId);
  const actionLabel = recipe ? `去${cookerNames[recipe.cooker]}制作` : source ? `去${source.generator.name}取材` : "";
  if (recipe) {
    return `
      <div class="atlas-path recipe-path">
        <div class="path-title">${itemChip(itemId, true)}<span>${html(itemInstruction(itemId))}</span></div>
        ${renderPathMeta(state, itemId, shortage)}
        <button class="mini-button atlas-source-btn" data-guide-source="${itemId}">${actionLabel}</button>
        <div class="path-chain">
          ${recipe.inputs.map((input) => itemChip(input, true)).join('<span class="path-arrow">+</span>')}
          <span class="path-arrow">=</span>
          ${itemChip(recipe.output, true)}
        </div>
      </div>
    `;
  }

  const path = itemPath(itemId);
  return `
    <div class="atlas-path">
      <div class="path-title">${itemChip(itemId, true)}<span>${html(itemInstruction(itemId))}</span></div>
      ${renderPathMeta(state, itemId, shortage)}
      ${actionLabel ? `<button class="mini-button atlas-source-btn" data-guide-source="${itemId}">${actionLabel}</button>` : ""}
      <div class="path-chain">
        ${path.map((id) => itemChip(id, true)).join('<span class="path-arrow">→</span>')}
      </div>
    </div>
  `;
};

const missingSummary = (state: GameState, needs: ItemId[]) => {
  const missing = countNeeds(needs)
    .map(([itemId, qty]) => {
      const owned = countBoardItem(state, itemId);
      return owned >= qty ? "" : `${itemById[itemId].name} ${owned}/${qty}`;
    })
    .filter(Boolean);
  return missing.length ? `还差 ${missing.join("、")}` : "材料齐了";
};

const shortageItems = (state: GameState, needs: ItemId[]) =>
  countNeeds(needs)
    .map(([itemId, qty]) => {
      const owned = countBoardItem(state, itemId);
      return { itemId, required: qty, owned, missing: Math.max(0, qty - owned) };
    })
    .filter((item) => item.missing > 0);

const renderQuickGuide = (state: GameState, needs: ItemId[]) => {
  const missing = shortageItems(state, needs).slice(0, 2);
  if (!missing.length) return "";
  return `
    <div class="quick-guide">
      <b>怎么做</b>
      ${missing
        .map((item) => {
          const estimate = formatEnergyEstimate(estimateShortageEnergy(state, item.itemId, item));
          const suffix = estimate ? ` · ${estimate}` : "";
          return `<button class="quick-guide-item" data-atlas-item="${item.itemId}">${html(itemById[item.itemId].name)}：缺 ${item.missing} 个 · ${html(itemInstruction(item.itemId))}${html(suffix)} · 查看图谱</button>`;
        })
        .join("")}
    </div>
  `;
};

const activeTaskScope = (state: GameState): TaskScope =>
  onboardingTasks.every((task) => isTaskRewardClaimed(state, task.id, "onboarding")) ? "daily" : "onboarding";

const tasksForScope = (scope: TaskScope) => (scope === "onboarding" ? onboardingTasks : dailyTasks);
const remainingTasksForScope = (state: GameState, scope: TaskScope) =>
  scope === "onboarding" ? remainingOnboardingTasks(state) : remainingDailyTasks(state);
const claimableTasksForScope = (state: GameState, scope: TaskScope) =>
  scope === "onboarding" ? claimableOnboardingTasks(state) : claimableDailyTasks(state);

const trackedTask = (state: GameState) => {
  const scope = activeTaskScope(state);
  const remaining = remainingTasksForScope(state, scope);
  const tracked = state.trackedTaskScope === scope ? remaining.find((task) => task.id === state.trackedTaskId) : undefined;
  return { scope, task: tracked ?? remaining[0] };
};

const renderTrackedTask = (state: GameState) => {
  const { scope, task } = trackedTask(state);
  const allTasks = tasksForScope(scope);
  const doneCount = allTasks.filter((item) => isTaskDone(state, item)).length;
  const claimableCount = claimableTasksForScope(state, scope).length;

  if (!task) {
    return `
      <section class="tracked-task done">
        <div>
          <span>${scope === "onboarding" ? "开张任务" : "今日委托"}</span>
          <b>${claimableCount ? `有 ${claimableCount} 个奖励待领取` : scope === "onboarding" ? "开张任务已完成" : "今日委托已完成"}</b>
        </div>
        <button class="mini-button" data-sheet="tasks">任务</button>
      </section>
    `;
  }

  const progress = taskProgress(state, task);
  return `
    <section class="tracked-task">
      <div>
        <span>${scope === "onboarding" ? "开张" : "今日"} ${doneCount}/${allTasks.length}</span>
        <b>${html(task.title)}</b>
        <p>${html(task.desc)}${progress.target > 1 ? ` · ${progress.current}/${progress.target}` : ""}</p>
      </div>
      <button class="mini-button" data-sheet="tasks">任务</button>
    </section>
  `;
};

const renderTaskGroup = (state: GameState, scope: TaskScope) => {
  const tasks = tasksForScope(scope);
  const visibleTasks = remainingTasksForScope(state, scope);
  const doneCount = tasks.filter((task) => isTaskDone(state, task)).length;
  const title = scope === "onboarding" ? "开张任务" : "今日委托";
  if (!visibleTasks.length) {
    return `
      <section class="task-group complete">
        <div class="panel-title"><h3>${title}</h3><span class="task-count">完成</span></div>
        <div class="task-complete"><b>${scope === "onboarding" ? "开张任务已完成" : "今日委托已完成"}</b><p>${scope === "onboarding" ? "现在可以开始完成今日委托。" : "明天会刷新新的三项委托。"}</p></div>
      </section>
    `;
  }

  return `
    <section class="task-group">
      <div class="panel-title"><h3>${title}</h3><span class="task-count">${doneCount}/${tasks.length}</span></div>
      <div class="task-list">
        ${visibleTasks
          .map((task) => {
            const done = isTaskDone(state, task);
            const progress = taskProgress(state, task);
            const isTracked = state.trackedTaskScope === scope && state.trackedTaskId === task.id;
            return `
              <div class="task-row ${done ? "done" : ""}">
                <span class="task-check">${done ? "✓" : ""}</span>
                <div><b>${html(task.title)}</b><p>${html(task.desc)}${progress.target > 1 ? ` · ${progress.current}/${progress.target}` : ""}</p></div>
                <small>${html(task.rewardLabel)}</small>
                ${
                  done
                    ? `<button class="mini-button claim-task-btn" data-claim-task="${task.id}" data-task-scope="${scope}">领取</button>`
                    : `<button class="mini-button track-task-btn" data-track-task="${task.id}" data-task-scope="${scope}" ${isTracked ? "disabled" : ""}>${isTracked ? "追踪中" : "追踪"}</button>`
                }
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const renderTasks = (state: GameState, compact = false) => `
  <div class="panel day-tasks ${compact ? "sheet-card" : ""}">
    <div class="panel-title"><h2>任务</h2><span>${state.dayKey}</span></div>
    ${renderTaskGroup(state, "onboarding")}
    ${activeTaskScope(state) === "daily" ? renderTaskGroup(state, "daily") : ""}
  </div>
`;

const currentFocusOrder = (state: GameState) => {
  const breakfast = orderById.order_001;
  const bao = orderById.order_007;
  const breakfastDone = state.completedOrders.includes("order_001");
  const baoDone = state.completedOrders.includes("order_007");
  return baoDone ? orderById.order_008 : breakfastDone ? bao : breakfast;
};

const renderTutorialBoard = (state: GameState, stepIndex: number) => {
  const step = tutorialSteps[stepIndex];
  const board = state.tutorial?.board ?? step.board.map((itemId) => (itemId ? { uid: itemId, itemId } : null));
  const selectedCell = state.tutorial?.selectedCell;
  return `
    <div class="training-board" role="grid" aria-label="新手教学棋盘">
      ${board
        .map((cell, index) => {
          const focused = step.focus.includes(index);
          if (!cell) {
            return `<button class="training-cell empty ${focused ? "focus" : ""} ${selectedCell === index ? "selected" : ""}" data-tutorial-cell="${index}" role="gridcell" aria-label="空格"></button>`;
          }

          const item = itemById[cell.itemId];
          return `
            <button class="training-cell filled ${focused ? "focus" : ""} ${selectedCell === index ? "selected" : ""}" data-tutorial-cell="${index}" role="gridcell" aria-label="${html(item.name)}">
              <span class="asset-gem" style="--gem:${item.color}" aria-hidden="true">
                ${artIcon(item.icon, { size: "large", label: item.name, color: item.color })}
              </span>
              <span class="cell-level">Lv.${item.level}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
};

const renderTutorialAction = (state: GameState, stepIndex: number) => {
  const done = !!state.tutorial?.actionDone;
  if (stepIndex === 1) {
    return `
      <div class="tutorial-action-card">
        <button class="generator-card tutorial-generator" data-tutorial-generator style="--accent:#6ebd62">
          <span class="generator-icon">${artIcon("veg", { size: "small", label: "菜篮" })}</span>
          <span class="generator-name">点菜篮取材</span>
          <span class="generator-meta">${done ? "已放入棋盘" : "试一次"}</span>
        </button>
      </div>
    `;
  }

  if (stepIndex === 2) {
    return `
      <button class="tutorial-order-card tutorial-order-button interactive ${done ? "done" : ""}" data-tutorial-order type="button">
        <span class="tutorial-tap-cue">${done ? "已确认" : "点这里确认目标"}</span>
        <span class="tutorial-order-main">
          <b>街坊早餐</b>
          <span class="tutorial-order-copy">需要棋盘上发光的 2 个材料</span>
          <span class="tutorial-order-needs">需要：${itemChip("greens_2", true)} ${itemChip("egg_2", true)}</span>
        </span>
        <span class="tutorial-order-cta">${done ? "已确认" : "确认"}</span>
      </button>
    `;
  }

  return `
    <div class="tutorial-order-card ${done ? "done" : ""}">
      <b>${done ? "操作完成" : "操作目标"}</b>
      <span>${stepIndex === 0 ? (done ? "菜叶已经合成小青菜。" : "点两片菜叶完成一次合成。") : "进入正式游戏，完成街坊早餐。"}</span>
    </div>
  `;
};

const renderTutorialPage = (state: GameState) => {
  const stepIndex = Math.max(0, Math.min(tutorialSteps.length - 1, state.tutorial?.step ?? 0));
  const step = tutorialSteps[stepIndex];
  const isLast = stepIndex === tutorialSteps.length - 1;
  const canContinue = isLast || !!state.tutorial?.actionDone;

  return `
    <main class="tutorial-shell">
      <section class="tutorial-page" aria-label="新手教学">
        <header class="tutorial-hero">
          <p class="eyebrow">新手教学</p>
          <h1>巷口花食铺</h1>
          <div class="tutorial-progress-track" aria-label="教学进度">
            ${tutorialSteps.map((_, index) => `<span class="${index <= stepIndex ? "active" : ""}"></span>`).join("")}
          </div>
        </header>

        <section class="tutorial-lesson">
          <div class="tutorial-copy">
            <span class="tutorial-progress">${stepIndex + 1}/${tutorialSteps.length}</span>
            <h2>${html(step.title)}</h2>
            <p>${html(step.body)}</p>
            <small>${html(step.tip)}</small>
          </div>
          ${renderTutorialBoard(state, stepIndex)}
          ${renderTutorialAction(state, stepIndex)}
        </section>

        <div class="tutorial-page-actions">
          <button class="secondary-button" ${state.tutorial?.resumeAvailable ? "data-tutorial-return" : "data-tutorial-prev"} ${!state.tutorial?.resumeAvailable && stepIndex === 0 ? "disabled" : ""}>${state.tutorial?.resumeAvailable ? "返回小店" : "上一步"}</button>
          <button class="primary-button" ${isLast ? "data-tutorial-complete" : "data-tutorial-next"} ${canContinue ? "" : "disabled"}>
            ${isLast ? "完成教学，开始游戏" : canContinue ? "下一步" : "先完成操作"}
          </button>
        </div>
      </section>
    </main>
  `;
};

const renderStoryDialog = (state: GameState) => {
  const story = state.pendingStory;
  if (!story) return "";

  const customer = customerById[story.customerId];
  const order = orderById[story.orderId];
  return `
    <div class="story-backdrop" role="dialog" aria-modal="true" aria-label="顾客故事">
      <article class="story-dialog">
        <div class="story-portrait" style="--avatar:${customer.color}">
          ${artIcon(customer.avatar, { size: "large", label: customer.name, color: customer.color })}
        </div>
        <div class="story-content">
          <span class="story-kicker">${html(customer.name)} · 第 ${story.chapter} 段</span>
          <h2>${html(order.title)}</h2>
          <p>${html(story.line)}</p>
          <div class="story-reward">已获得：${order.coin} 金币 · ${order.xp} 经验${order.storyPoints ? ` · ${order.storyPoints} 故事点` : ""}</div>
          <button class="primary-button story-close-btn">继续经营</button>
        </div>
      </article>
    </div>
  `;
};

const renderFocusGoal = (state: GameState) => {
  const breakfastDone = state.completedOrders.includes("order_001");
  const baoDone = state.completedOrders.includes("order_007");

  const goal = currentFocusOrder(state);
  const ready = hasItems(state, goal.needs);
  const title = baoDone ? "第三目标：做一份清晨花礼" : breakfastDone ? "第二目标：做出青菜包" : "第一目标：完成街坊早餐";
  const nextAction = baoDone
    ? missingSummary(state, goal.needs)
    : ready
      ? `材料齐了，去订单区提交「${goal.title}」。`
      : missingSummary(state, goal.needs);

  return `
    <section class="focus-goal" aria-label="当前推荐目标">
      <div>
        <span class="goal-kicker">${ready ? "可完成" : "推荐目标"}</span>
        <h2>${html(title)}</h2>
        <p>${html(nextAction)}</p>
      </div>
      <div class="goal-needs">${renderNeedList(state, goal.needs)}</div>
    </section>
  `;
};

const renderMergeAtlas = (state: GameState, id = "atlas-panel") => {
  const focusOrder = currentFocusOrder(state);
  const missing = shortageItems(state, focusOrder.needs);
  const focusedItem = state.atlasFocusItemId;
  const focusedShortage = focusedItem ? missing.find((item) => item.itemId === focusedItem) : undefined;
  const chainGroups = ["greens", "tomato", "egg", "wheat", "daisy", "rose", "box", "ribbon"]
    .map((chain) => items.filter((item) => item.chain === chain))
    .filter((group) => group.length > 0);

  return `
    <details class="panel atlas-panel" id="${id}" open>
      <summary class="panel-title">
        <h2>合成图谱</h2>
        <span>缺材料怎么做</span>
      </summary>
      <div class="atlas-section">
        <h3>${focusedItem ? `已定位：${html(itemById[focusedItem].name)}` : `当前目标：${html(focusOrder.title)}`}</h3>
        ${
          focusedItem
            ? renderPath(state, focusedItem, focusedShortage)
            : missing.length
              ? missing.map((item) => renderPath(state, item.itemId, item)).join("")
            : `<div class="atlas-empty">当前订单材料已经齐了，直接去订单区提交。</div>`
        }
      </div>
      <details class="atlas-more">
        <summary>查看全部基础链</summary>
        <div class="chain-list">
          ${chainGroups
            .map(
              (group) => `
                <div class="chain-row">
                  ${group.map((item) => itemChip(item.id, true)).join('<span class="path-arrow">→</span>')}
                </div>
              `,
            )
            .join("")}
        </div>
      </details>
      <details class="atlas-more">
        <summary>查看菜品与礼盒配方</summary>
        <div class="chain-list">
          ${recipes.map((recipe) => renderPath(state, recipe.output)).join("")}
        </div>
      </details>
    </details>
  `;
};

const renderOrdersPanel = (state: GameState, id = "orders-panel") => `
  <div class="panel orders" id="${id}">
    <div class="panel-title"><h2>订单</h2></div>
    <div class="order-list">
      ${state.activeOrders
        .map((orderId) => {
          const order = orderById[orderId];
          const customer = customerById[order.customerId];
          const canSubmit = hasItems(state, order.needs);
          const recommended = order.id === "order_001" || (state.completedOrders.includes("order_001") && order.id === "order_007");
          return `
            <article class="order-card ${order.story ? "story" : ""} ${recommended ? "recommended" : ""}">
              <div class="order-head">
                <span class="avatar" style="--avatar:${customer.color}">${artIcon(customer.avatar, { size: "small", label: customer.name, color: customer.color })}</span>
                <div>
                  <h3>${html(order.title)}</h3>
                  <p>${html(customer.name)} · ${recommended ? "推荐先做" : order.story ? "故事订单" : customer.role}</p>
                </div>
              </div>
              <div class="need-list">${renderNeedList(state, order.needs)}</div>
              <div class="card-hint ${canSubmit ? "ready" : ""}">${html(canSubmit ? "材料齐了，可以提交" : missingSummary(state, order.needs))}</div>
              ${renderQuickGuide(state, order.needs)}
              <div class="order-reward">+${order.coin} 金币 · +${order.xp} 经验${order.storyPoints ? ` · +${order.storyPoints} 故事点` : ""}</div>
              <button class="primary-button" data-order="${order.id}" ${canSubmit ? "" : "disabled"}>提交订单</button>
            </article>
          `;
        })
        .join("")}
    </div>
  </div>
`;

const renderRecipesPanel = (state: GameState) => `
  <details class="panel recipes collapsible-panel" ${state.completedOrders.includes("order_001") ? "open" : ""}>
    <summary class="panel-title"><h2>菜品与礼盒</h2><span>${state.completedOrders.includes("order_001") ? "已展开" : "早餐后展开"}</span></summary>
    <div class="recipe-list">
      ${recipes
        .map((recipe) => {
          const canStart = hasItems(state, recipe.inputs) && !state.cookers[recipe.cooker].recipeId;
          const stationBusy = !!state.cookers[recipe.cooker].recipeId;
          return `
            <article class="recipe-card ${recipe.id === state.guidedRecipeId ? "guided" : ""}">
              <div class="recipe-main">
                ${itemChip(recipe.output, true)}
                <div>
                  <h3>${recipe.name}</h3>
                  <p>${cookerNames[recipe.cooker]} · ${formatTime(recipe.durationMs)}</p>
                </div>
              </div>
              <div class="need-list">${renderNeedList(state, recipe.inputs)}</div>
              <div class="card-hint ${canStart ? "ready" : ""}">${html(canStart ? "材料齐了，可以开做" : stationBusy ? `${cookerNames[recipe.cooker]}正忙` : missingSummary(state, recipe.inputs))}</div>
              ${renderQuickGuide(state, recipe.inputs)}
              <button class="secondary-button" data-recipe="${recipe.id}" ${canStart ? "" : "disabled"}>开始制作</button>
            </article>
          `;
        })
        .join("")}
    </div>
  </details>
`;

const renderUpgradesPanel = (state: GameState) => `
  <details class="panel shop-upgrades collapsible-panel" ${state.completedOrders.includes("order_007") ? "open" : ""}>
    <summary class="panel-title"><h2>店铺升级</h2><span>${state.completedOrders.includes("order_007") ? "已展开" : "故事点后展开"}</span></summary>
    <div class="upgrade-list">
      ${shopUpgrades
        .map((area) => {
          const current = state.shop[area.id];
          const level = area.levels.find((item) => item.level === current)!;
          const next = area.levels.find((item) => item.level === current + 1);
          const canUpgrade = !!next && state.coins >= next.coinCost && state.storyPoints >= next.storyCost;
          return `
            <article class="upgrade-card">
              <h3>${area.name} Lv.${current}</h3>
              <p>${level.title} · ${level.effect}</p>
              <button class="secondary-button" data-upgrade="${area.id}" ${canUpgrade ? "" : "disabled"}>
                ${next ? `${next.coinCost} 金币 / ${next.storyCost} 故事点` : "已满级"}
              </button>
            </article>
          `;
        })
        .join("")}
    </div>
  </details>
`;

const renderBoardCell = (cell: BoardItem | null, index: number, state: GameState) => {
  if (!cell) {
    return `<button class="board-cell empty ${state.selectedCell === index ? "selected" : ""}" data-cell="${index}" aria-label="空格"></button>`;
  }

  const item = itemById[cell.itemId];
  return `
    <button class="board-cell filled ${state.selectedCell === index ? "selected" : ""}" data-cell="${index}" draggable="true" aria-label="${html(item.name)}">
      <span class="asset-gem" style="--gem:${item.color}" aria-hidden="true">
        ${artIcon(item.icon, { size: "large", label: item.name, color: item.color })}
      </span>
      <span class="cell-name">${html(item.name)}</span>
      <span class="cell-level">Lv.${item.level}</span>
    </button>
  `;
};

const renderShopStage = (state: GameState) => {
  const sign = state.shop.signboard;
  const tables = state.shop.tables;
  const flower = state.shop.flower_shelf;
  const kitchen = state.shop.kitchen;
  const total = sign + tables + flower + kitchen;
  return `
    <section class="shop-stage" aria-label="小店外观">
      <img src="${shopArtUrl}" alt="巷口花食铺小店美术基准图" />
      <div class="shop-stage-overlay">
        <strong>小店修复度 ${Math.round((total / 12) * 100)}%</strong>
        <span>门头 Lv.${sign} · 餐桌 Lv.${tables} · 花架 Lv.${flower} · 后厨 Lv.${kitchen}</span>
      </div>
    </section>
  `;
};

const renderGeneratorButtons = (state: GameState) =>
  generators
    .map((generator) => {
      const genState = state.generators[generator.id];
      const waiting = genState.charges <= 0 ? formatTime(genState.readyAt - Date.now()) : "";
      return `
        <button class="generator-card ${state.guidedGeneratorId === generator.id ? "guided" : ""}" data-generator="${generator.id}" style="--accent:${generator.color}">
          <span class="generator-icon">${artIcon(generator.icon, { size: "small", label: generator.name, color: generator.color })}</span>
          <span class="generator-name">${html(generator.name)}</span>
          <span class="generator-meta">${genState.charges}/${generator.maxCharges}${waiting ? ` · ${waiting}` : ""}</span>
        </button>
      `;
    })
    .join("");

const renderCookerCards = (state: GameState) =>
  (["steamer", "pan", "gift_table"] as const)
    .map((cookerId) => {
      const cooker = state.cookers[cookerId];
      const recipe = cooker.recipeId ? recipes.find((item) => item.id === cooker.recipeId) : undefined;
      const ready = cooker.readyAt ? Date.now() >= cooker.readyAt : false;
      return `
        <div class="cooker-card ${recipe ? "busy" : ""} ${recipe?.id === state.guidedRecipeId ? "guided" : ""}">
          <div class="cooker-head">
            <span class="cooker-title">${artIcon(cookerId, { size: "tiny", label: cookerNames[cookerId] })}<b>${cookerNames[cookerId]}</b></span>
            <button class="mini-button" data-collect="${cookerId}" ${!recipe ? "disabled" : ""}>${ready ? "收取" : "查看"}</button>
          </div>
          <p>${recipe ? `${recipe.name} · ${formatTime((cooker.readyAt ?? 0) - Date.now())}` : "空闲中"}</p>
        </div>
      `;
    })
    .join("");

const renderMobileTools = (state: GameState) => `
  <div class="mobile-tools" id="material-tools">
    <div class="mobile-tool-head">
      <h2>取材</h2>
      <button class="text-button energy-btn">模拟广告 +30 体力</button>
    </div>
    <div class="generator-grid">${renderGeneratorButtons(state)}</div>
  </div>
`;

const renderMobileTabs = () => `
  <nav class="mobile-tabbar" aria-label="快速导航">
    <button class="mobile-tab active" data-close-sheet aria-current="page">
      <span class="tab-art">${artIcon("board_nav", { size: "tiny", label: "棋盘" })}</span>
      <span>棋盘</span>
    </button>
    <button class="mobile-tab" data-sheet="tasks">
      <span class="tab-art">${artIcon("order_nav", { size: "tiny", label: "任务" })}</span>
      <span>任务</span>
    </button>
    <button class="mobile-tab" data-sheet="orders">
      <span class="tab-art">${artIcon("order_nav", { size: "tiny", label: "订单" })}</span>
      <span>订单</span>
    </button>
    <button class="mobile-tab" data-sheet="atlas">
      <span class="tab-art">${artIcon("atlas_nav", { size: "tiny", label: "图谱" })}</span>
      <span>图谱</span>
    </button>
    <button class="mobile-tab" data-sheet="shop">
      <span class="tab-art">${artIcon("florist", { size: "tiny", label: "店铺" })}</span>
      <span>店铺</span>
    </button>
  </nav>
`;

const renderMobileSheet = (name: string, title: string, body: string) => `
  <section class="mobile-sheet" data-sheet-panel="${name}" hidden>
    <div class="mobile-sheet-head">
      <h2>${html(title)}</h2>
      <button class="icon-button mobile-sheet-close" data-close-sheet aria-label="关闭">×</button>
    </div>
    <div class="mobile-sheet-body">${body}</div>
  </section>
`;

const renderMobileSheets = (state: GameState) => `
  <div class="mobile-sheet-backdrop" data-close-sheet hidden></div>
  ${renderMobileSheet("tasks", "任务", renderTasks(state, true))}
  ${renderMobileSheet("orders", "订单", renderOrdersPanel(state, "mobile-orders-panel"))}
  ${renderMobileSheet("atlas", "合成图谱", renderMergeAtlas(state, "mobile-atlas-panel"))}
  ${renderMobileSheet(
    "shop",
    "店铺与制作",
    `
      ${renderShopStage(state)}
      <div class="cooker-grid">${renderCookerCards(state)}</div>
      ${renderRecipesPanel(state)}
      ${renderUpgradesPanel(state)}
    `,
  )}
`;

const bindAction = (root: HTMLElement, selector: string, event: string, handler: (el: HTMLElement, evt: Event) => void) => {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.addEventListener(event, (evt) => handler(el, evt));
  });
};

export const renderApp = (root: HTMLElement, state: GameState, commit: Commit, ui: RenderUiState) => {
  const tutorial = state.tutorial ?? { step: 0, open: true, completed: false };
  if (!tutorial.completed) {
    root.innerHTML = renderTutorialPage(state);
    bindAction(root, "[data-tutorial-cell]", "click", (el) => commit(selectTutorialCell(state, Number(el.dataset.tutorialCell))));
    root.querySelector("[data-tutorial-generator]")?.addEventListener("click", () => commit(useTutorialGenerator(state)));
    root.querySelector("[data-tutorial-order]")?.addEventListener("click", () => commit(confirmTutorialOrder(state)));
    root.querySelector("[data-tutorial-prev]")?.addEventListener("click", () => commit(setTutorialStep(state, (state.tutorial?.step ?? 0) - 1)));
    root.querySelector("[data-tutorial-return]")?.addEventListener("click", () => commit(returnToShop(state)));
    root.querySelector("[data-tutorial-next]")?.addEventListener("click", () => commit(setTutorialStep(state, (state.tutorial?.step ?? 0) + 1)));
    root.querySelector("[data-tutorial-complete]")?.addEventListener("click", () => commit(completeTutorial(state)));
    return;
  }

  root.innerHTML = `
    <main class="game-shell ${ui.pulse ? `reward-${ui.pulse}` : ""}">
      <header class="topbar">
        <div>
          <p class="eyebrow">Web MVP 原型</p>
          <h1>巷口花食铺</h1>
        </div>
        <div class="wallet">
          <span><span class="wallet-label-full">金币</span><span class="wallet-label-short">金</span> <b>${state.coins}</b></span>
          <span><span class="wallet-label-full">体力</span><span class="wallet-label-short">体</span> <b>${state.energy}/${state.maxEnergy}</b></span>
          <span><span class="wallet-label-full">经验</span><span class="wallet-label-short">验</span> <b>${state.xp}</b></span>
          <span><span class="wallet-label-full">故事点</span><span class="wallet-label-short">故</span> <b>${state.storyPoints}</b></span>
          <span><span class="wallet-label-full">Lv.</span><span class="wallet-label-short">Lv</span><b>${state.level}</b></span>
        </div>
        <button class="icon-button tutorial-open-btn" title="重新进入新手教学" aria-label="重新进入新手教学">?</button>
        <button class="icon-button reset-btn" title="重置存档" aria-label="重置存档">R</button>
      </header>

      <section class="message-toast ${ui.toast ? "visible" : ""}" role="status" aria-live="polite">${html(ui.toast)}</section>
      ${renderStoryDialog(state)}

      <div class="layout">
        <section class="left-rail">
          ${renderShopStage(state)}
          ${renderTasks(state)}

          <div class="panel generators">
            <div class="panel-title">
              <h2>取材</h2>
              <button class="text-button energy-btn">模拟广告 +30 体力</button>
            </div>
            <div class="generator-grid">${renderGeneratorButtons(state)}</div>
          </div>

          <div class="panel cookers">
            <div class="panel-title"><h2>制作台</h2></div>
            <div class="cooker-grid">${renderCookerCards(state)}</div>
          </div>
        </section>

        <section class="board-panel" id="play-area">
          ${renderTrackedTask(state)}
          <div class="panel-title board-title">
            <h2>合成棋盘</h2>
            <button class="text-button sell-btn" ${state.selectedCell === undefined ? "disabled" : ""}>出售选中</button>
          </div>
          <div class="board">
            ${state.board.map((cell, index) => renderBoardCell(cell, index, state)).join("")}
          </div>
          ${renderMobileTools(state)}
        </section>

        <aside class="right-rail">
          ${renderOrdersPanel(state)}
          ${renderMergeAtlas(state)}
          ${renderRecipesPanel(state)}
          ${renderUpgradesPanel(state)}
        </aside>
      </div>
      ${renderMobileSheets(state)}
      ${renderMobileTabs()}
    </main>
  `;

  bindAction(root, "[data-generator]", "click", (el) => commit(useGenerator(state, el.dataset.generator as never, ui.runtime)));
  bindAction(root, "[data-cell]", "click", (el) => commit(selectOrMoveCell(state, Number(el.dataset.cell))));
  bindAction(root, "[data-order]", "click", (el) => commit(submitOrder(state, el.dataset.order as never)));
  bindAction(root, "[data-recipe]", "click", (el) => commit(startRecipe(state, el.dataset.recipe!, ui.runtime.nowMs)));
  bindAction(root, "[data-collect]", "click", (el) => commit(collectCooker(state, el.dataset.collect as never, ui.runtime.nowMs)));
  bindAction(root, "[data-upgrade]", "click", (el) => commit(upgradeShop(state, el.dataset.upgrade as never)));
  bindAction(root, "[data-track-task]", "click", (el) => commit(trackTask(state, el.dataset.trackTask!, el.dataset.taskScope as TaskScope)));
  bindAction(root, "[data-claim-task]", "click", (el) => commit(claimTaskReward(state, el.dataset.claimTask!, el.dataset.taskScope as TaskScope)));

  const closeSheet = () => {
    root.querySelector(".game-shell")?.removeAttribute("data-open-sheet");
    root.querySelector(".mobile-sheet-backdrop")?.setAttribute("hidden", "");
    root.querySelectorAll<HTMLElement>("[data-sheet-panel]").forEach((panel) => panel.setAttribute("hidden", ""));
    root.querySelectorAll("[data-sheet], [data-close-sheet]").forEach((button) => {
      button.classList.toggle("active", button.hasAttribute("data-close-sheet") && button.classList.contains("mobile-tab"));
      if (button.hasAttribute("data-close-sheet") && button.classList.contains("mobile-tab")) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  const openSheet = (sheet: string) => {
    const activeButton = root.querySelector(`.mobile-tab[data-sheet="${sheet}"]`);
    root.querySelector(".game-shell")?.setAttribute("data-open-sheet", sheet);
    root.querySelector(".mobile-sheet-backdrop")?.removeAttribute("hidden");
    root.querySelectorAll<HTMLElement>("[data-sheet-panel]").forEach((panel) => {
      panel.toggleAttribute("hidden", panel.dataset.sheetPanel !== sheet);
    });
    root.querySelectorAll("[data-sheet], [data-close-sheet]").forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  };

  bindAction(root, "[data-sheet]", "click", (el) => {
    const sheet = el.dataset.sheet;
    if (!sheet) return;
    openSheet(sheet);
  });
  bindAction(root, "[data-close-sheet]", "click", () => closeSheet());
  bindAction(root, "[data-atlas-item]", "click", (el) => {
    commit(focusAtlasItem(state, el.dataset.atlasItem as ItemId));
    openSheet("atlas");
  });
  bindAction(root, "[data-guide-source]", "click", (el) => {
    const itemId = el.dataset.guideSource as ItemId;
    const next = guideMaterialSource(state, itemId);
    commit(next);
    openSheet(next.guidedRecipeId ? "shop" : "board");
    if (!next.guidedRecipeId) closeSheet();
  });

  root.querySelectorAll(".energy-btn").forEach((button) => button.addEventListener("click", () => commit(addEnergyReward(state))));
  root.querySelector(".story-close-btn")?.addEventListener("click", () => commit(dismissStory(state)));
  root.querySelector(".tutorial-open-btn")?.addEventListener("click", () => commit(restartTutorial(state)));
  root.querySelector(".sell-btn")?.addEventListener("click", () => {
    if (state.selectedCell !== undefined) commit(sellCell(state, state.selectedCell));
  });
  root.querySelector(".reset-btn")?.addEventListener("click", () => {
    clearGame();
    window.location.reload();
  });

  root.querySelectorAll<HTMLElement>("[data-cell][draggable=true]").forEach((cell) => {
    cell.addEventListener("dragstart", (evt) => {
      evt.dataTransfer?.setData("text/plain", cell.dataset.cell ?? "");
    });
  });

  root.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell) => {
    cell.addEventListener("dragover", (evt) => evt.preventDefault());
    cell.addEventListener("drop", (evt) => {
      evt.preventDefault();
      const from = Number(evt.dataTransfer?.getData("text/plain"));
      const to = Number(cell.dataset.cell);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        const selected = selectOrMoveCell({ ...state, selectedCell: from }, to);
        commit(selected);
      }
    });
  });
};
