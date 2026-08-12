import { defineConfig } from "@playwright/test";
import fs from "node:fs";

const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.PLAYWRIGHT_BROWSER_PATH ?? (fs.existsSync(macChrome) ? macChrome : undefined);

export default defineConfig({
  testDir: "./tests-cocos",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4199",
    headless: true,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: {
    command: "npx vite preview --host 127.0.0.1 --port 4199 --strictPort --outDir wechat-client/build/web-mobile",
    url: "http://127.0.0.1:4199",
    reuseExistingServer: false,
  },
});
