import type { GameState } from "./types";

export const SAVE_KEY = "xiangkou-huashipu-save-v5";
export const LEGACY_SAVE_KEY = "xiangkou-huashipu-save-v4";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const browserStorage: StorageAdapter = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

const localDayKey = (currentTime: number) => {
  const date = new Date(currentTime);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const inferNextUid = (state: Partial<GameState>) => {
  const ids = [...(state.board ?? []), ...(state.tutorial?.board ?? [])]
    .flatMap((item) => (item ? [Number(item.uid.replace(/^item-/, ""))] : []))
    .filter(Number.isFinite);
  return Math.max(1, ...ids) + 1;
};

export const migrateGame = (saved: unknown, currentTime: number): GameState | null => {
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
    dayKey: state.dayKey ?? localDayKey(currentTime),
    dailyProgress: state.dailyProgress ?? { materials: 0, merges: 0, orders: 0 },
    dailyClaimedTaskIds: [...(state.dailyClaimedTaskIds ?? [])],
    atlasFocusItemId: undefined,
    guidedGeneratorId: undefined,
    guidedRecipeId: undefined,
  };
};

export const loadGame = (currentTime: number, storage: StorageAdapter = browserStorage): GameState | null => {
  try {
    const raw = storage.getItem(SAVE_KEY) ?? storage.getItem(LEGACY_SAVE_KEY);
    return raw ? migrateGame(JSON.parse(raw), currentTime) : null;
  } catch {
    return null;
  }
};

export const saveGame = (state: GameState, storage: StorageAdapter = browserStorage) => {
  const { atlasFocusItemId: _atlas, guidedGeneratorId: _generator, guidedRecipeId: _recipe, ...persisted } = state;
  storage.setItem(SAVE_KEY, JSON.stringify({ ...persisted, message: "" }));
};

export const clearGame = (storage: StorageAdapter = browserStorage) => {
  storage.removeItem(SAVE_KEY);
  storage.removeItem(LEGACY_SAVE_KEY);
};
