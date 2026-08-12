import type { GameRuntime } from "../domain/types";

export interface RuntimeSnapshot {
  randomSeed: number;
}

export class DeterministicGameRuntime {
  private timeOffsetMs = 0;
  private randomSeed: number;

  public constructor(
    private readonly deviceClock: () => number,
    seed = 0x6d2b79f5,
  ) {
    this.randomSeed = seed >>> 0 || 1;
  }

  public syncServerTime(serverNowMs: number): void {
    this.timeOffsetMs = serverNowMs - this.deviceClock();
  }

  public now(): number {
    return this.deviceClock() + this.timeOffsetMs;
  }

  public random(): number {
    let next = this.randomSeed;
    next ^= next << 13;
    next ^= next >>> 17;
    next ^= next << 5;
    this.randomSeed = next >>> 0 || 1;
    return this.randomSeed / 0x1_0000_0000;
  }

  public input(): GameRuntime {
    return { nowMs: this.now(), random: () => this.random() };
  }

  public snapshot(): RuntimeSnapshot {
    return { randomSeed: this.randomSeed };
  }

  public restore(snapshot: Partial<RuntimeSnapshot> | undefined): void {
    if (snapshot?.randomSeed) this.randomSeed = snapshot.randomSeed >>> 0 || 1;
  }
}
