import type { PlatformAdapter } from "../application/contracts";
import { MockPlatformAdapter, type StringStorage } from "./mock-platform-adapter";
import { createWechatCloudConfig } from "./wechat-cloud-services";
import { WechatPlatformAdapter } from "./wechat-platform-adapter";

export interface BootstrapPlatform {
  platform: PlatformAdapter;
  playerId: string;
  mode: "web-local" | "wechat-local" | "wechat-cloud";
  requiresLogin: boolean;
}

interface WechatRuntimeConfig {
  cloudEnv?: string;
  cloudFunctionName?: string;
  energyAdUnitId?: string;
  cookerAdUnitId?: string;
}

export const createPlatformAdapter = (
  clock: () => number,
  webStorage: StringStorage,
  localSaveKey: string,
): BootstrapPlatform => {
  const hasWechatRuntime = typeof (globalThis as unknown as { wx?: unknown }).wx !== "undefined";
  if (!hasWechatRuntime) {
    return {
      platform: new MockPlatformAdapter(clock, webStorage, localSaveKey),
      playerId: "local-player",
      mode: "web-local",
      requiresLogin: false,
    };
  }

  const runtimeConfig = (globalThis as unknown as { __HUASHIPU_WECHAT_CONFIG__?: WechatRuntimeConfig }).__HUASHIPU_WECHAT_CONFIG__;
  if (runtimeConfig?.cloudEnv) {
    return {
      platform: new WechatPlatformAdapter(createWechatCloudConfig({
        env: runtimeConfig.cloudEnv,
        functionName: runtimeConfig.cloudFunctionName,
        localSaveKey,
        adUnitIds: {
          energy: runtimeConfig.energyAdUnitId,
          cooker: runtimeConfig.cookerAdUnitId,
        },
      })),
      playerId: "wechat-offline-player",
      mode: "wechat-cloud",
      requiresLogin: true,
    };
  }

  return {
    platform: new WechatPlatformAdapter({
      localSaveKey,
      adUnitIds: { energy: undefined, cooker: undefined },
      serverNow: async () => clock(),
      exchangeLoginCode: async () => ({ playerId: "wechat-local-player" }),
      readCloudSave: async () => null,
      writeCloudSave: async () => undefined,
      track: () => undefined,
    }),
    playerId: "wechat-local-player",
    mode: "wechat-local",
    requiresLogin: false,
  };
};
