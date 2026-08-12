import type {
  AnalyticsEvent,
  LoginResult,
  PlatformAdapter,
  RewardedPlacement,
  RewardedResult,
  SaveEnvelope,
  SharePayload,
} from "../application/contracts";

declare const wx: any;

export interface WechatPlatformConfig {
  localSaveKey: string;
  adUnitIds: Record<RewardedPlacement, string | undefined>;
  serverNow: () => Promise<number>;
  exchangeLoginCode: (code: string) => Promise<LoginResult>;
  readCloudSave: () => Promise<SaveEnvelope | null>;
  writeCloudSave: (value: SaveEnvelope) => Promise<void>;
  track: (event: AnalyticsEvent) => void;
}

export class WechatPlatformAdapter implements PlatformAdapter {
  private readonly rewardedAds = new Map<RewardedPlacement, any>();

  public constructor(private readonly config: WechatPlatformConfig) {}

  public now(): Promise<number> {
    return this.config.serverNow();
  }

  public login(): Promise<LoginResult> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (result: { code?: string }) => {
          if (!result.code) {
            reject(new Error("wx.login returned no code"));
            return;
          }
          this.config.exchangeLoginCode(result.code).then(resolve, reject);
        },
        fail: reject,
      });
    });
  }

  public readLocalSave(): string | null {
    const value = wx.getStorageSync(this.config.localSaveKey);
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  public writeLocalSave(value: string): void {
    wx.setStorageSync(this.config.localSaveKey, value);
  }

  public readCloudSave(): Promise<SaveEnvelope | null> {
    return this.config.readCloudSave();
  }

  public writeCloudSave(value: SaveEnvelope): Promise<void> {
    return this.config.writeCloudSave(value);
  }

  public async showRewardedVideo(placement: RewardedPlacement): Promise<RewardedResult> {
    const adUnitId = this.config.adUnitIds[placement];
    if (!adUnitId || typeof wx.createRewardedVideoAd !== "function") return "unavailable";
    const ad = this.rewardedAds.get(placement) ?? wx.createRewardedVideoAd({ adUnitId, multiton: true });
    this.rewardedAds.set(placement, ad);

    return new Promise((resolve) => {
      const cleanup = () => {
        ad.offClose?.(onClose);
        ad.offError?.(onError);
      };
      const onClose = (result?: { isEnded?: boolean }) => {
        cleanup();
        resolve(result?.isEnded === false ? "skipped" : "completed");
      };
      const onError = () => {
        cleanup();
        resolve("unavailable");
      };
      ad.onClose(onClose);
      ad.onError(onError);
      Promise.resolve(ad.show()).catch(() => Promise.resolve(ad.load()).then(() => ad.show())).catch(onError);
    });
  }

  public share(payload: SharePayload): Promise<void> {
    wx.shareAppMessage({ title: payload.title, imageUrl: payload.imageUrl, query: payload.query });
    return Promise.resolve();
  }

  public track(event: AnalyticsEvent): void {
    this.config.track(event);
  }

  public onHide(handler: () => void): () => void {
    wx.onHide(handler);
    return () => wx.offHide?.(handler);
  }
}
