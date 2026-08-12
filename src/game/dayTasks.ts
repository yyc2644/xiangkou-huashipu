import type { DailyTaskId, GameState, RewardDef, TaskScope } from "./types";

export interface TaskDef {
  id: string;
  scope: TaskScope;
  title: string;
  desc: string;
  rewardLabel: string;
  reward: RewardDef;
  target?: number;
}

export const onboardingTasks: TaskDef[] = [
  { id: "take_material", scope: "onboarding", title: "取一次材料", desc: "点菜篮、花篮或杂货箱。", rewardLabel: "+5 体力", reward: { energy: 5 } },
  { id: "merge_greens", scope: "onboarding", title: "合成小青菜", desc: "把两片菜叶合成 Lv.2。", rewardLabel: "+10 金币", reward: { coins: 10 } },
  { id: "complete_breakfast", scope: "onboarding", title: "完成街坊早餐", desc: "提交林阿姨的第一单。", rewardLabel: "+10 体力", reward: { energy: 10 } },
  { id: "start_bao", scope: "onboarding", title: "开始制作青菜包", desc: "凑齐面团和鲜青菜后开蒸锅。", rewardLabel: "+15 金币", reward: { coins: 15 } },
  { id: "complete_bao_story", scope: "onboarding", title: "完成热腾腾包子", desc: "交付青菜包，拿故事点。", rewardLabel: "+15 体力", reward: { energy: 15 } },
  { id: "upgrade_signboard", scope: "onboarding", title: "修一次门头", desc: "用金币让小店更像开张。", rewardLabel: "+10 经验", reward: { xp: 10 } },
];

export const dailyTasks: TaskDef[] = [
  { id: "daily_materials", scope: "daily", title: "补齐食材", desc: "今天取材 8 次。", target: 8, rewardLabel: "+12 体力", reward: { energy: 12 } },
  { id: "daily_merges", scope: "daily", title: "整理货架", desc: "今天完成 6 次合成。", target: 6, rewardLabel: "+25 金币", reward: { coins: 25 } },
  { id: "daily_orders", scope: "daily", title: "招待街坊", desc: "今天完成 1 份订单。", target: 1, rewardLabel: "+15 经验", reward: { xp: 15 } },
];

// Keep the old export name while existing balance and autoplay scripts migrate.
export const dayOneTasks = onboardingTasks;
export const dayOneTaskById = Object.fromEntries(onboardingTasks.map((task) => [task.id, task])) as Record<string, TaskDef>;
export const dailyTaskById = Object.fromEntries(dailyTasks.map((task) => [task.id, task])) as Record<DailyTaskId, TaskDef>;

export const taskDayKey = (currentTime: number) => {
  const date = new Date(currentTime);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const countBoardItem = (state: GameState, itemId: string) => state.board.filter((item) => item?.itemId === itemId).length;

export const isOnboardingTaskDone = (state: GameState, id: string) => {
  const milestones = state.milestones ?? {};
  switch (id) {
    case "take_material":
      return !!milestones.take_material;
    case "merge_greens":
      return !!milestones.merge_greens || countBoardItem(state, "greens_2") > 0 || state.completedOrders.includes("order_001");
    case "complete_breakfast":
      return !!milestones.complete_breakfast || state.completedOrders.includes("order_001");
    case "start_bao":
      return !!milestones.start_bao || state.cookers.steamer.recipeId === "recipe_bao" || countBoardItem(state, "dish_bao") > 0 || state.completedOrders.includes("order_007");
    case "complete_bao_story":
      return !!milestones.complete_bao_story || state.completedOrders.includes("order_007");
    case "upgrade_signboard":
      return !!milestones.upgrade_signboard || state.shop.signboard >= 2;
    default:
      return false;
  }
};

export const isDailyTaskDone = (state: GameState, id: DailyTaskId) => {
  const target = dailyTaskById[id]?.target ?? 0;
  switch (id) {
    case "daily_materials":
      return state.dailyProgress.materials >= target;
    case "daily_merges":
      return state.dailyProgress.merges >= target;
    case "daily_orders":
      return state.dailyProgress.orders >= target;
  }
};

export const taskProgress = (state: GameState, task: TaskDef) => {
  if (task.scope === "onboarding") return { current: isOnboardingTaskDone(state, task.id) ? 1 : 0, target: 1 };
  switch (task.id as DailyTaskId) {
    case "daily_materials":
      return { current: state.dailyProgress.materials, target: task.target ?? 0 };
    case "daily_merges":
      return { current: state.dailyProgress.merges, target: task.target ?? 0 };
    case "daily_orders":
      return { current: state.dailyProgress.orders, target: task.target ?? 0 };
  }
};

export const isTaskDone = (state: GameState, task: TaskDef) =>
  task.scope === "onboarding" ? isOnboardingTaskDone(state, task.id) : isDailyTaskDone(state, task.id as DailyTaskId);

export const isTaskRewardClaimed = (state: GameState, taskId: string, scope: TaskScope = "onboarding") =>
  scope === "onboarding" ? (state.claimedTaskIds ?? []).includes(taskId) : state.dailyClaimedTaskIds.includes(taskId as DailyTaskId);

export const remainingOnboardingTasks = (state: GameState) => onboardingTasks.filter((task) => !isTaskRewardClaimed(state, task.id, "onboarding"));
export const claimableOnboardingTasks = (state: GameState) => onboardingTasks.filter((task) => isOnboardingTaskDone(state, task.id) && !isTaskRewardClaimed(state, task.id, "onboarding"));
export const remainingDailyTasks = (state: GameState) => dailyTasks.filter((task) => !isTaskRewardClaimed(state, task.id, "daily"));
export const claimableDailyTasks = (state: GameState) => dailyTasks.filter((task) => isDailyTaskDone(state, task.id as DailyTaskId) && !isTaskRewardClaimed(state, task.id, "daily"));

// Compatibility aliases used by current checks.
export const isDayTaskDone = isOnboardingTaskDone;
export const remainingDayTasks = remainingOnboardingTasks;
export const claimableDayTasks = claimableOnboardingTasks;
