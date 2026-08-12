import { taskDayKey } from "./dayTasks";
import type { GameState } from "./types";

const inferNextUid = (state: Partial<GameState>) => {
  const ids = [...(state.board ?? []), ...(state.tutorial?.board ?? [])]
    .flatMap((item) => (item ? [Number(item.uid.replace(/^item-/, ""))] : []))
    .filter(Number.isFinite);
  return Math.max(1, ...ids) + 1;
};

export const migrateGameState = (saved: unknown, currentTime: number): GameState | null => {
  if (!saved || typeof saved !== "object") return null;
  const state = saved as Partial<GameState>;
  if (!Array.isArray(state.board) || !state.generators || !state.cookers || !state.shop) return null;

  return {
    ...(state as GameState),
    saveVersion: 5,
    nextUid: state.nextUid ?? inferNextUid(state),
    message: "",
    claimedTaskIds: [...(state.claimedTaskIds ?? [])],
    trackedTaskScope: state.trackedTaskScope ?? "onboarding",
    dayKey: state.dayKey ?? taskDayKey(currentTime),
    dailyProgress: state.dailyProgress ?? { materials: 0, merges: 0, orders: 0 },
    dailyClaimedTaskIds: [...(state.dailyClaimedTaskIds ?? [])],
    atlasFocusItemId: undefined,
    guidedGeneratorId: undefined,
    guidedRecipeId: undefined,
  };
};

export const persistentGameState = (state: GameState): GameState => ({
  ...state,
  message: "",
  atlasFocusItemId: undefined,
  guidedGeneratorId: undefined,
  guidedRecipeId: undefined,
});
