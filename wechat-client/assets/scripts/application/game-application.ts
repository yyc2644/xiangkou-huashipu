import type { GameState } from "../domain/types";
import type { AnalyticsEventName, PlatformAdapter, RewardedPlacement, RewardedResult, SaveEnvelope } from "./contracts";
import type { DeterministicGameRuntime } from "./game-runtime";
import { SaveRepository } from "./save-repository";

export class GameApplication {
  private envelope: SaveEnvelope | null = null;
  private readonly sessionId: string;
  private unsubscribeHide?: () => void;
  private saveChain: Promise<void> = Promise.resolve();

  public constructor(
    private state: GameState,
    private readonly platform: PlatformAdapter,
    private readonly repository: SaveRepository,
    private readonly clientVersion: string,
    private readonly runtime: DeterministicGameRuntime,
  ) {
    this.sessionId = `session-${this.runtime.now().toString(36)}`;
  }

  public async start(): Promise<GameState> {
    const loaded = await this.repository.load();
    if (loaded.envelope) {
      this.envelope = loaded.envelope;
      this.state = loaded.envelope.state;
      this.runtime.restore({ randomSeed: loaded.envelope.randomSeed });
    }
    if (loaded.conflict) this.track("save_conflict", { source: loaded.source });
    this.unsubscribeHide = this.platform.onHide(() => void this.enqueueFlush());
    this.track("game_start", { saveSource: loaded.source });
    return this.state;
  }

  public getState(): GameState {
    return this.state;
  }

  public async commit(next: GameState, event?: AnalyticsEventName, properties?: Record<string, string | number | boolean | undefined>): Promise<GameState> {
    this.state = next;
    if (event) this.track(event, properties);
    await this.enqueueFlush();
    return this.state;
  }

  public destroy(): void {
    this.unsubscribeHide?.();
  }

  private enqueueFlush(): Promise<void> {
    this.saveChain = this.saveChain.then(() => this.flush());
    return this.saveChain;
  }

  public async showRewardedVideo(placement: RewardedPlacement): Promise<RewardedResult> {
    this.track("ad_request", { placement });
    let result: RewardedResult = "unavailable";
    try {
      result = await this.platform.showRewardedVideo(placement);
    } catch {
      result = "unavailable";
    }
    this.track("ad_result", { placement, result });
    return result;
  }

  private async flush(): Promise<void> {
    try {
      this.envelope = await this.repository.save(this.state, this.envelope?.revision ?? 0);
    } catch (error) {
      this.track("save_error", { message: error instanceof Error ? error.message : "unknown" });
    }
  }

  private track(name: AnalyticsEventName, properties?: Record<string, string | number | boolean | undefined>): void {
    this.platform.track({
      name,
      eventId: `${this.sessionId}-${this.runtime.now().toString(36)}-${this.runtime.random().toString(36).slice(2, 8)}`,
      sessionId: this.sessionId,
      occurredAt: this.runtime.now(),
      level: this.state.level,
      completedOrders: this.state.completedOrders.length,
      energy: this.state.energy,
      platform: this.platform.constructor.name.startsWith("Wechat") ? "wechat" : "mock",
      clientVersion: this.clientVersion,
      properties,
    });
  }
}
