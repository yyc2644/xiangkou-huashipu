import type { GameState } from "../domain/types";

export type RewardedPlacement = "energy" | "cooker";
export type RewardedResult = "completed" | "skipped" | "unavailable";

export interface LoginResult {
  playerId: string;
  sessionToken?: string;
}

export interface SaveEnvelope {
  schemaVersion: 5;
  revision: number;
  updatedAt: number;
  playerId: string;
  deviceId: string;
  randomSeed?: number;
  state: GameState;
}

export interface SharePayload {
  title: string;
  imageUrl?: string;
  query?: string;
}

export type AnalyticsEventName =
  | "game_start"
  | "tutorial_step"
  | "tutorial_complete"
  | "generator_used"
  | "merge_complete"
  | "recipe_start"
  | "recipe_collect"
  | "order_complete"
  | "task_claim"
  | "shop_upgrade"
  | "ad_request"
  | "ad_result"
  | "save_error"
  | "save_conflict";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  eventId: string;
  sessionId: string;
  occurredAt: number;
  playerId?: string;
  level?: number;
  completedOrders?: number;
  energy?: number;
  platform: "mock" | "wechat";
  clientVersion: string;
  properties?: Record<string, string | number | boolean | undefined>;
}

export interface PlatformAdapter {
  now(): Promise<number>;
  login(): Promise<LoginResult>;
  readLocalSave(): string | null;
  writeLocalSave(value: string): void;
  readCloudSave(): Promise<SaveEnvelope | null>;
  writeCloudSave(value: SaveEnvelope): Promise<void>;
  showRewardedVideo(placement: RewardedPlacement): Promise<RewardedResult>;
  share(payload: SharePayload): Promise<void>;
  track(event: AnalyticsEvent): void;
  onHide(handler: () => void): () => void;
}
