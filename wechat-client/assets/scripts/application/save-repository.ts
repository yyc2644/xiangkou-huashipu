import { migrateGameState, persistentGameState } from "../domain/save-migration";
import type { GameState } from "../domain/types";
import type { PlatformAdapter, SaveEnvelope } from "./contracts";

const SAVE_KEY_VERSION = 5 as const;

export interface LoadedSave {
  envelope: SaveEnvelope | null;
  source: "none" | "local" | "cloud";
  conflict: boolean;
}

export class SaveRepository {
  public constructor(
    private readonly platform: PlatformAdapter,
    private readonly playerId: string,
    private readonly deviceId: string,
    private readonly getRandomSeed: () => number = () => 1,
  ) {}

  public async load(): Promise<LoadedSave> {
    const currentTime = await this.platform.now();
    const local = this.parse(this.platform.readLocalSave(), currentTime);
    let cloud: SaveEnvelope | null = null;

    try {
      cloud = await this.platform.readCloudSave();
    } catch {
      return { envelope: local, source: local ? "local" : "none", conflict: false };
    }

    if (!local && !cloud) return { envelope: null, source: "none", conflict: false };
    if (!local) return { envelope: cloud, source: "cloud", conflict: false };
    if (!cloud) return { envelope: local, source: "local", conflict: false };

    const conflict = local.revision !== cloud.revision || local.updatedAt !== cloud.updatedAt;
    const cloudWins = cloud.revision > local.revision
      || (cloud.revision === local.revision && cloud.updatedAt > local.updatedAt);
    return { envelope: cloudWins ? cloud : local, source: cloudWins ? "cloud" : "local", conflict };
  }

  public async save(state: GameState, previousRevision: number): Promise<SaveEnvelope> {
    const envelope: SaveEnvelope = {
      schemaVersion: SAVE_KEY_VERSION,
      revision: previousRevision + 1,
      updatedAt: await this.platform.now(),
      playerId: this.playerId,
      deviceId: this.deviceId,
      randomSeed: this.getRandomSeed(),
      state: persistentGameState(state),
    };

    this.platform.writeLocalSave(JSON.stringify(envelope));
    try {
      await this.platform.writeCloudSave(envelope);
    } catch {
      // Local progress remains authoritative until the next sync attempt.
    }
    return envelope;
  }

  private parse(raw: string | null, currentTime: number): SaveEnvelope | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<SaveEnvelope> & Partial<GameState>;
      if (parsed.schemaVersion === SAVE_KEY_VERSION && parsed.state && typeof parsed.revision === "number") {
        const state = migrateGameState(parsed.state, currentTime);
        return state ? { ...(parsed as SaveEnvelope), state } : null;
      }

      const legacyState = migrateGameState(parsed, currentTime);
      return legacyState
        ? {
            schemaVersion: SAVE_KEY_VERSION,
            revision: 0,
            updatedAt: currentTime,
            playerId: this.playerId,
            deviceId: this.deviceId,
            randomSeed: 1,
            state: legacyState,
          }
        : null;
    } catch {
      return null;
    }
  }
}
