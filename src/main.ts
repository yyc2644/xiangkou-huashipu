import "./styles.css";
import { createInitialState, tickState } from "./game/state";
import { renderApp } from "./ui/render";
import { loadGame, saveGame } from "./game/save";
import type { GameState } from "./game/types";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app");
}

const bootTime = Date.now();
let state: GameState = loadGame(bootTime) ?? createInitialState(bootTime);
state = tickState(state, bootTime);
let toast = "";
let pulse: "merge" | "order" | "task" | undefined;
let clearToastTimer: number | undefined;

const runtime = () => ({ nowMs: Date.now(), random: Math.random });

const commit = (next: GameState) => {
  const message = next.message;
  state = { ...next, message: "" };
  saveGame(state);
  if (message) {
    toast = message;
    pulse = message.includes("合成") ? "merge" : message.includes("完成「") ? "order" : message.includes("领取") ? "task" : undefined;
    if (clearToastTimer !== undefined) window.clearTimeout(clearToastTimer);
    clearToastTimer = window.setTimeout(() => {
      toast = "";
      pulse = undefined;
      render();
    }, 2800);
  }
  render();
};

const render = () => {
  renderApp(app, state, commit, { toast, pulse, runtime: runtime() });
};

render();

window.setInterval(() => {
  const next = tickState(state, Date.now());
  if (next !== state) {
    commit(next);
  }
}, 1000);
