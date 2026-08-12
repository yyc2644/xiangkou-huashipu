import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repairCocosSourceMetas } from "./repair-cocos-meta.mjs";
import { configureWechatBuild } from "./configure-wechat-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = path.join(root, "wechat-client");
const creator = process.env.COCOS_CREATOR ?? "/Applications/CocosCreator.app/Contents/MacOS/CocosCreator";
const supportedTargets = new Set(["web-mobile", "wechatgame"]);
const requestedTarget = process.argv[2] ?? "wechatgame";
const targets = requestedTarget === "all" ? [...supportedTargets] : [requestedTarget];

for (const target of targets) {
  if (!supportedTargets.has(target)) {
    throw new Error(`未知 Cocos 构建目标：${target}`);
  }
}

if (!fs.existsSync(creator)) throw new Error(`未找到 Cocos Creator：${creator}`);
repairCocosSourceMetas();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hasWarmEditor() {
  const result = spawnSync("ps", ["-ax", "-o", "command="], { encoding: "utf8" });
  return result.stdout
    .split("\n")
    .some((line) => line.includes(`${creator} --project ${project}`) && !line.includes(" --build "));
}

function waitForEditorReady(child, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("等待 Cocos 资源库就绪超时")), timeoutMs);
    const onData = (chunk) => {
      output = `${output}${chunk}`.slice(-40_000);
      if (/asset-db is ready|asset db is ready/i.test(output)) {
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Cocos 编辑器提前退出，状态码 ${code}\n${output.slice(-4000)}`));
    });
  });
}

function runBuild(target) {
  const config = path.join(project, "build-config", `${target}.json`);
  const outputDir = path.join(project, "build", target);
  fs.rmSync(outputDir, { recursive: true, force: true });

  return new Promise((resolve, reject) => {
    const child = spawn(creator, ["--project", project, "--build", `configPath=${config}`], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const onData = (chunk) => {
      output = `${output}${chunk}`.slice(-120_000);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("error", reject);
    child.once("exit", (code) => {
      const finished = output.includes(`build Task (${target}) Finished`);
      const entry = target === "wechatgame" ? "game.js" : "index.html";
      const hasEntry = fs.existsSync(path.join(outputDir, entry));
      if ((code === 0 || code === 36) && finished && hasEntry) {
        resolve(outputDir);
        return;
      }
      reject(new Error(`Cocos ${target} 构建失败，状态码 ${code}\n${output.slice(-8000)}`));
    });
  });
}

function directorySize(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const target = path.join(directory, entry.name);
    return total + (entry.isDirectory() ? directorySize(target) : fs.statSync(target).size);
  }, 0);
}

let editor;
let ownsEditor = false;
try {
  if (hasWarmEditor()) {
    console.log("复用已就绪的 Cocos 编辑器资源库");
  } else {
    console.log("启动 Cocos 编辑器并等待资源库就绪...");
    editor = spawn(creator, ["--project", project], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    ownsEditor = true;
    await waitForEditorReady(editor);
  }

  for (const target of targets) {
    console.log(`构建 ${target}...`);
    const outputDir = await runBuild(target);
    if (target === "wechatgame") configureWechatBuild(outputDir);
    const sizeMb = directorySize(outputDir) / 1024 / 1024;
    console.log(`${target} 构建完成：${outputDir} (${sizeMb.toFixed(2)} MB)`);
  }
} finally {
  if (ownsEditor && editor && editor.exitCode === null) {
    editor.kill("SIGTERM");
    await sleep(1500);
    if (editor.exitCode === null) editor.kill("SIGKILL");
  }
  repairCocosSourceMetas();
}
