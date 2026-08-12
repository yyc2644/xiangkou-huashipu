import type { AnalyticsEvent, LoginResult, RewardedPlacement, SaveEnvelope } from "../application/contracts";
import type { WechatPlatformConfig } from "./wechat-platform-adapter";

declare const wx: any;

export interface WechatCloudOptions {
  env: string;
  functionName?: string;
  localSaveKey: string;
  adUnitIds: Record<RewardedPlacement, string | undefined>;
}

interface CloudResponse<T> {
  ok: boolean;
  data?: T;
  conflict?: boolean;
  message?: string;
}

export const createWechatCloudConfig = (options: WechatCloudOptions): WechatPlatformConfig => {
  const functionName = options.functionName ?? "game-service";
  let initialized = false;

  const call = async <T>(action: string, payload?: Record<string, unknown>): Promise<T> => {
    if (!initialized) {
      wx.cloud.init({ env: options.env, traceUser: true });
      initialized = true;
    }
    const response = await wx.cloud.callFunction({ name: functionName, data: { action, ...payload } });
    const result = response?.result as CloudResponse<T> | undefined;
    if (!result?.ok) {
      const error = new Error(result?.message ?? `cloud action failed: ${action}`);
      (error as Error & { conflict?: boolean }).conflict = result?.conflict;
      throw error;
    }
    return result.data as T;
  };

  return {
    localSaveKey: options.localSaveKey,
    adUnitIds: options.adUnitIds,
    serverNow: () => call<number>("now"),
    exchangeLoginCode: (_code: string): Promise<LoginResult> => call<LoginResult>("login"),
    readCloudSave: () => call<SaveEnvelope | null>("load"),
    writeCloudSave: async (value: SaveEnvelope) => {
      await call<SaveEnvelope>("save", { envelope: value });
    },
    track: (event: AnalyticsEvent) => {
      void call<void>("analytics", { event }).catch(() => undefined);
    },
  };
};
