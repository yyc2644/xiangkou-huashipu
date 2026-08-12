import type {
  AnalyticsEvent,
  LoginResult,
  PlatformAdapter,
  RewardedPlacement,
  RewardedResult,
  SaveEnvelope,
  SharePayload,
} from "../application/contracts";

export interface StringStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class MockPlatformAdapter implements PlatformAdapter {
  private localSave: string | null = null;
  private cloudSave: SaveEnvelope | null = null;
  private readonly hideHandlers = new Set<() => void>();

  public constructor(
    private readonly clock: () => number = Date.now,
    private readonly storage?: StringStorage,
    private readonly localSaveKey = "xiangkou-huashipu-cocos-v5",
  ) {}

  public now(): Promise<number> {
    return Promise.resolve(this.clock());
  }

  public login(): Promise<LoginResult> {
    return Promise.resolve({ playerId: "mock-player" });
  }

  public readLocalSave(): string | null {
    return this.storage?.getItem(this.localSaveKey) ?? this.localSave;
  }

  public writeLocalSave(value: string): void {
    this.localSave = value;
    this.storage?.setItem(this.localSaveKey, value);
  }

  public readCloudSave(): Promise<SaveEnvelope | null> {
    return Promise.resolve(this.cloudSave);
  }

  public writeCloudSave(value: SaveEnvelope): Promise<void> {
    this.cloudSave = value;
    return Promise.resolve();
  }

  public showRewardedVideo(_placement: RewardedPlacement): Promise<RewardedResult> {
    return Promise.resolve("completed");
  }

  public share(_payload: SharePayload): Promise<void> {
    return Promise.resolve();
  }

  public track(_event: AnalyticsEvent): void {}

  public onHide(handler: () => void): () => void {
    this.hideHandlers.add(handler);
    return () => this.hideHandlers.delete(handler);
  }

  public simulateHide(): void {
    this.hideHandlers.forEach((handler) => handler());
  }
}
