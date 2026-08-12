import {
  _decorator,
  Camera,
  Canvas,
  Color,
  Component,
  EventTouch,
  Graphics,
  Label,
  Layers,
  Node,
  ResolutionPolicy,
  resources,
  Sprite,
  SpriteFrame,
  sys,
  UITransform,
  Vec3,
  view,
} from "cc";
import { GameApplication } from "../application/game-application";
import { DeterministicGameRuntime } from "../application/game-runtime";
import { SaveRepository } from "../application/save-repository";
import type { AnalyticsEventName } from "../application/contracts";
import {
  cookerNames,
  customerById,
  itemById,
  items,
  orderById,
  orders,
  recipes,
  shopUpgrades,
} from "../domain/catalog";
import {
  dailyTasks,
  isTaskDone,
  isTaskRewardClaimed,
  onboardingTasks,
  taskDayKey,
  taskProgress,
} from "../domain/dayTasks";
import {
  accelerateCooker,
  addEnergyReward,
  claimTaskReward,
  collectCooker,
  completeTutorial,
  confirmTutorialOrder,
  createInitialState,
  dismissStory,
  focusAtlasItem,
  guideMaterialSource,
  hasItems,
  openTutorial,
  restartTutorial,
  returnToShop,
  selectOrMoveCell,
  selectTutorialCell,
  sellCell,
  setTutorialStep,
  startRecipe,
  submitOrder,
  tickState,
  trackTask,
  upgradeShop,
  useGenerator,
  useTutorialGenerator,
} from "../domain/state";
import type { CookerId, GameState, GeneratorId, ItemId, TaskScope } from "../domain/types";
import { createPlatformAdapter } from "../platform/create-platform-adapter";
import { computeMainScreenLayout, DESIGN_HEIGHT, DESIGN_WIDTH, normalizeVisibleHeight } from "./layout";

const { ccclass } = _decorator;
const SAVE_KEY = "xiangkou-huashipu-cocos-v5";
const DEVICE_KEY = "xiangkou-huashipu-device-id";
const RECIPE_PAGE_SIZE = 4;

const COLORS = {
  background: new Color(248, 243, 232, 255),
  surface: new Color(255, 253, 249, 255),
  surfaceGreen: new Color(238, 247, 233, 255),
  ink: new Color(45, 62, 52, 255),
  muted: new Color(91, 104, 94, 255),
  line: new Color(211, 213, 201, 255),
  green: new Color(71, 116, 76, 255),
  greenSoft: new Color(167, 190, 162, 255),
  pink: new Color(190, 107, 133, 255),
  blue: new Color(83, 140, 166, 255),
  gold: new Color(177, 126, 48, 255),
  danger: new Color(180, 78, 72, 255),
  disabled: new Color(229, 229, 223, 255),
};

type MainView = "board" | "tasks" | "orders" | "craft" | "shop" | "atlas";

@ccclass("GameBootstrap")
export class GameBootstrap extends Component {
  private state!: GameState;
  private application?: GameApplication;
  private runtime!: DeterministicGameRuntime;
  private rootNode?: Node;
  private currentView: MainView = "board";
  private toastText = "";
  private toastRevision = 0;
  private selectedCooker: CookerId = "steamer";
  private recipePage = 0;
  private readonly itemSprites = new Map<string, SpriteFrame>();

  protected onLoad(): void {
    view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, ResolutionPolicy.FIXED_WIDTH);
    this.configureCanvas();
    this.renderLoading("正在打开小店...");
    void this.initialize();
  }

  protected onDestroy(): void {
    this.application?.destroy();
  }

  private configureCanvas(): void {
    const canvas = this.node.getComponent(Canvas) ?? this.node.addComponent(Canvas);
    const cameraNode = this.node.getChildByName("Camera");
    const camera = cameraNode?.getComponent(Camera) ?? null;
    if (camera) {
      camera.visibility |= Layers.Enum.UI_2D;
      canvas.cameraComponent = camera;
    }
    canvas.alignCanvasWithScreen = true;
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
  }

  private async initialize(): Promise<void> {
    try {
      const deviceClock = () => Date.now();
      this.runtime = new DeterministicGameRuntime(deviceClock, 0x51a7cafe);
      const storage = {
        getItem: (key: string) => sys.localStorage.getItem(key),
        setItem: (key: string, value: string) => sys.localStorage.setItem(key, value),
      };
      const platformContext = createPlatformAdapter(deviceClock, storage, SAVE_KEY);
      const platform = platformContext.platform;
      try {
        this.runtime.syncServerTime(await platform.now());
      } catch {
        this.runtime.syncServerTime(deviceClock());
      }

      let playerId = platformContext.playerId;
      if (platformContext.requiresLogin) {
        try {
          playerId = (await platform.login()).playerId;
        } catch {
          playerId = platformContext.playerId;
        }
      }

      let deviceId = storage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = `device-${Math.floor(this.runtime.random() * 0xffff_ffff).toString(36)}`;
        storage.setItem(DEVICE_KEY, deviceId);
      }

      const repository = new SaveRepository(platform, playerId, deviceId, () => this.runtime.snapshot().randomSeed);
      this.application = new GameApplication(
        createInitialState(this.runtime.now()),
        platform,
        repository,
        "0.1.0",
        this.runtime,
      );
      this.state = await this.application.start();
      this.state = tickState(this.state, this.runtime.now());
      await this.loadItemSprites();
      this.captureToast(this.state.message);
      this.render();
      this.schedule(this.refreshTimers, 1);
    } catch (error) {
      this.renderLoading(error instanceof Error ? `启动失败：${error.message}` : "启动失败，请重新打开。", true);
    }
  }

  private readonly refreshTimers = (): void => {
    if (!this.application || !this.state) return;
    const now = this.runtime.now();
    const needsTick = this.state.energy < this.state.maxEnergy
      || Object.values(this.state.generators).some((generator) => generator.charges <= 0)
      || this.state.dayKey !== taskDayKey(now);
    if (needsTick) {
      const next = tickState(this.state, now);
      if (next !== this.state) {
        this.applyState(next);
        return;
      }
    }
    if (this.currentView === "craft") this.render();
  };

  private applyState(
    next: GameState,
    event?: AnalyticsEventName,
    properties?: Record<string, string | number | boolean | undefined>,
  ): void {
    this.state = next;
    this.captureToast(next.message);
    this.render();
    void this.application?.commit(next, event, properties);
  }

  private loadItemSprites(): Promise<void> {
    return new Promise((resolve) => {
      resources.loadDir("art/items", SpriteFrame, (error, frames) => {
        if (!error) {
          frames.forEach((frame) => this.itemSprites.set(frame.name.replace(/\/spriteFrame$/, ""), frame));
        }
        resolve();
      });
    });
  }

  private captureToast(message: string): void {
    if (!message) return;
    this.toastText = message;
    const revision = ++this.toastRevision;
    this.scheduleOnce(() => {
      if (revision !== this.toastRevision) return;
      this.toastText = "";
      this.render();
    }, 1.8);
  }

  private visibleHeight(): number {
    return normalizeVisibleHeight(view.getVisibleSize().height);
  }

  private createRoot(): Node {
    if (this.rootNode) {
      this.rootNode.removeFromParent();
      this.rootNode.destroy();
    }
    const root = this.uiNode("ScreenRoot");
    this.node.addChild(root);
    this.rootNode = root;
    this.panel(root, DESIGN_WIDTH, this.visibleHeight(), COLORS.background, 0, 0);
    return root;
  }

  private renderLoading(message: string, error = false): void {
    const root = this.createRoot();
    this.label(root, "巷口花食铺", 24, COLORS.ink, 0, 52, 330, 42);
    this.label(root, message, 14, error ? COLORS.danger : COLORS.muted, 0, -4, 330, 60);
  }

  private render(): void {
    if (!this.state) return;
    if (this.state.tutorial?.open && !this.state.tutorial.completed) {
      this.renderTutorial();
      return;
    }
    const root = this.createRoot();
    this.renderHeader(root);
    switch (this.currentView) {
      case "tasks":
        this.renderTasks(root);
        break;
      case "orders":
        this.renderOrders(root);
        break;
      case "craft":
        this.renderCraft(root);
        break;
      case "shop":
        this.renderShop(root);
        break;
      case "atlas":
        this.renderAtlas(root);
        break;
      default:
        this.renderBoard(root);
    }
    this.renderNavigation(root);
    this.renderToast(root);
    this.renderStoryDialog(root);
  }

  private renderHeader(root: Node): void {
    const { top, headerCenterY } = computeMainScreenLayout(this.visibleHeight());
    this.panel(root, DESIGN_WIDTH, 62, COLORS.surface, 0, headerCenterY, 0, COLORS.line);
    this.label(root, "巷口花食铺", 20, COLORS.ink, -72, top - 19, 220, 30, Label.HorizontalAlign.LEFT);
    this.label(
      root,
      `金币 ${this.state.coins}   体力 ${this.state.energy}/${this.state.maxEnergy}   Lv.${this.state.level}`,
      12,
      COLORS.muted,
      -39,
      top - 45,
      286,
      22,
      Label.HorizontalAlign.LEFT,
    );
    this.button(root, "?", 34, 34, 168, top - 31, () => {
      this.applyState(restartTutorial(this.state), "tutorial_step", { step: 0, replay: true });
    }, true, COLORS.surfaceGreen, COLORS.green);
  }

  private renderNavigation(root: Node): void {
    const { bottom, navigationCenterY } = computeMainScreenLayout(this.visibleHeight());
    this.panel(root, DESIGN_WIDTH, 54, new Color(53, 71, 61, 255), 0, navigationCenterY);
    const entries: Array<{ view: Exclude<MainView, "atlas">; title: string }> = [
      { view: "board", title: "棋盘" },
      { view: "tasks", title: "任务" },
      { view: "orders", title: "订单" },
      { view: "craft", title: "制作" },
      { view: "shop", title: "店铺" },
    ];
    entries.forEach((entry, index) => {
      const selected = this.currentView === entry.view || (this.currentView === "atlas" && entry.view === "orders");
      this.button(
        root,
        entry.title,
        68,
        38,
        -148 + index * 74,
        bottom + 27,
        () => {
          this.currentView = entry.view;
          this.render();
        },
        true,
        selected ? new Color(238, 247, 233, 255) : new Color(53, 71, 61, 255),
        selected ? COLORS.green : Color.WHITE,
        selected ? COLORS.greenSoft : new Color(53, 71, 61, 255),
      );
    });
  }

  private renderBoard(root: Node): void {
    const layout = computeMainScreenLayout(this.visibleHeight());
    const { top, bottom } = layout;
    const selected = this.state.selectedCell;
    const selectedItem = selected === undefined ? undefined : this.state.board[selected];
    const tracked = this.trackedTaskLabel();
    this.panel(root, 354, 36, COLORS.surfaceGreen, 0, top - 82, 6, COLORS.greenSoft);
    this.label(
      root,
      selectedItem
        ? `已选：${itemById[selectedItem.itemId].name} Lv.${itemById[selectedItem.itemId].level}`
        : this.state.energy <= 0 ? "体力用完了，可看一次广告补充 30 点。" : tracked,
      12,
      COLORS.ink,
      selectedItem || this.state.energy <= 0 ? -42 : 0,
      top - 82,
      selectedItem || this.state.energy <= 0 ? 246 : 336,
      28,
      Label.HorizontalAlign.LEFT,
    );
    if (selectedItem && selected !== undefined) {
      this.button(root, "出售", 70, 28, 137, top - 82, () => this.applyState(sellCell(this.state, selected)), true, COLORS.surface, COLORS.danger, COLORS.line);
    } else if (this.state.energy <= 0) {
      this.button(root, "补体力", 70, 28, 137, top - 82, () => void this.rewardEnergy(), true, new Color(255, 244, 214, 255), COLORS.gold, COLORS.gold);
    }

    const generatorY = layout.generatorY;
    const boardTop = layout.boardTop;
    const boardBottom = layout.boardBottom;
    const gap = 3;
    const cellWidth = 48;
    const cellHeight = layout.boardCellHeight;
    const centerY = layout.boardCenterY;

    this.state.board.forEach((cell, index) => {
      const column = index % 7;
      const row = Math.floor(index / 7);
      const node = this.uiNode(`Cell-${index}`);
      node.setPosition(new Vec3((column - 3) * (cellWidth + gap), centerY + (4 - row) * (cellHeight + gap)));
      root.addChild(node);
      node.addComponent(UITransform).setContentSize(cellWidth, cellHeight);
      const isSelected = selected === index;
      this.panel(
        node,
        cellWidth,
        cellHeight,
        cell ? this.colorFromHex(itemById[cell.itemId].color, 42) : COLORS.surface,
        0,
        0,
        6,
        isSelected ? COLORS.pink : COLORS.line,
      );
      if (cell) {
        const item = itemById[cell.itemId];
        this.renderItem(node, item.id, cellWidth, cellHeight);
      }
      node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => {
        const beforeMerges = this.state.dailyProgress.merges;
        const next = selectOrMoveCell(this.state, index);
        const merged = next.dailyProgress.merges > beforeMerges;
        this.applyState(next, merged ? "merge_complete" : undefined, merged ? { cell: index } : undefined);
      });
    });

    this.label(root, "取材", 13, COLORS.ink, -160, bottom + 126, 60, 22, Label.HorizontalAlign.LEFT);
    this.generatorButton(root, "菜篮", "veg_basket", -120, generatorY);
    this.generatorButton(root, "花篮", "flower_basket", 0, generatorY);
    this.generatorButton(root, "杂货箱", "market_crate", 120, generatorY);
  }

  private generatorButton(parent: Node, title: string, id: GeneratorId, x: number, y: number): void {
    const meta = this.state.generators[id];
    const guided = this.state.guidedGeneratorId === id;
    this.button(
      parent,
      `${title}\n${meta.charges}`,
      108,
      56,
      x,
      y,
      () => this.applyState(useGenerator(this.state, id, this.runtime.input()), "generator_used", { generatorId: id }),
      true,
      guided ? new Color(255, 243, 213, 255) : COLORS.surfaceGreen,
      COLORS.ink,
      guided ? COLORS.gold : COLORS.greenSoft,
    );
  }

  private trackedTaskLabel(): string {
    const scope = this.state.trackedTaskScope ?? "onboarding";
    const tasks = scope === "daily" ? dailyTasks : onboardingTasks;
    const task = tasks.find((candidate) => candidate.id === this.state.trackedTaskId);
    if (!task) return "先取材，再把相同材料两两合成。";
    const progress = taskProgress(this.state, task);
    return `追踪：${task.title}  ${Math.min(progress.current, progress.target)}/${progress.target}`;
  }

  private renderTasks(root: Node): void {
    const top = this.visibleHeight() / 2;
    const onboardingComplete = onboardingTasks.every((task) => isTaskRewardClaimed(this.state, task.id, "onboarding"));
    const tasks = onboardingComplete ? dailyTasks : onboardingTasks;
    this.sectionTitle(root, onboardingComplete ? "今日委托" : "开张任务", onboardingComplete ? this.state.dayKey : "全部领取后开启每日委托");
    const startY = top - 132;
    const rowGap = tasks.length > 4 ? 70 : 82;
    tasks.forEach((task, index) => {
      const y = startY - index * rowGap;
      const done = isTaskDone(this.state, task);
      const claimed = isTaskRewardClaimed(this.state, task.id, task.scope);
      const progress = taskProgress(this.state, task);
      const tracked = this.state.trackedTaskId === task.id && (this.state.trackedTaskScope ?? "onboarding") === task.scope;
      this.panel(root, 354, rowGap - 8, claimed ? COLORS.disabled : COLORS.surface, 0, y, 6, done && !claimed ? COLORS.gold : COLORS.line);
      this.label(root, task.title, 14, COLORS.ink, -82, y + 13, 174, 24, Label.HorizontalAlign.LEFT);
      this.label(
        root,
        `${task.desc}  ${Math.min(progress.current, progress.target)}/${progress.target}  ${task.rewardLabel}`,
        10,
        COLORS.muted,
        -59,
        y - 14,
        220,
        34,
        Label.HorizontalAlign.LEFT,
      );
      const action = claimed ? "已领取" : done ? "领取" : tracked ? "追踪中" : "追踪";
      this.button(root, action, 78, 30, 132, y, () => {
        if (claimed) return;
        if (done) {
          this.applyState(claimTaskReward(this.state, task.id, task.scope), "task_claim", { taskId: task.id, scope: task.scope });
        } else {
          this.applyState(trackTask(this.state, task.id, task.scope));
        }
      }, !claimed, done ? new Color(255, 244, 214, 255) : COLORS.surfaceGreen, done ? COLORS.gold : COLORS.green, done ? COLORS.gold : COLORS.greenSoft);
    });
  }

  private renderOrders(root: Node): void {
    const top = this.visibleHeight() / 2;
    this.sectionTitle(root, "顾客订单", `已完成 ${this.state.completedOrders.length}/${orders.length}`);
    const startY = top - 142;
    this.state.activeOrders.forEach((orderId, index) => {
      const order = orderById[orderId];
      const customer = customerById[order.customerId];
      const ready = hasItems(this.state, order.needs);
      const needs = order.needs.map((itemId) => itemById[itemId].name).join(" + ");
      const y = startY - index * 100;
      this.panel(root, 354, 90, COLORS.surface, 0, y, 6, ready ? COLORS.greenSoft : COLORS.line);
      this.label(root, `${customer.name} · ${order.title}`, 14, COLORS.ink, -66, y + 24, 210, 24, Label.HorizontalAlign.LEFT);
      this.label(root, needs, 11, COLORS.muted, -66, y - 2, 210, 28, Label.HorizontalAlign.LEFT);
      this.label(root, `${order.coin} 金币  ${order.xp} 经验${order.storyPoints ? `  ${order.storyPoints} 故事点` : ""}`, 10, COLORS.gold, -66, y - 28, 210, 22, Label.HorizontalAlign.LEFT);
      this.button(root, ready ? "提交" : "查来源", 84, 34, 130, y, () => {
        if (ready) {
          this.applyState(submitOrder(this.state, order.id), "order_complete", { orderId: order.id });
          return;
        }
        const missing = order.needs.find((itemId, needIndex) => {
          const required = order.needs.slice(0, needIndex + 1).filter((candidate) => candidate === itemId).length;
          const owned = this.state.board.filter((item) => item?.itemId === itemId).length;
          return owned < required;
        }) ?? order.needs[0];
        this.currentView = "atlas";
        this.applyState(guideMaterialSource(focusAtlasItem(this.state, missing), missing));
      }, true, ready ? COLORS.surfaceGreen : new Color(244, 238, 249, 255), ready ? COLORS.green : COLORS.pink, ready ? COLORS.greenSoft : COLORS.pink);
    });
  }

  private renderCraft(root: Node): void {
    const top = this.visibleHeight() / 2;
    this.sectionTitle(root, "制作台", "材料先在棋盘合成，再来加工");
    const cookerTabs: Array<{ id: CookerId; title: string }> = [
      { id: "steamer", title: "蒸锅" },
      { id: "pan", title: "煎台" },
      { id: "gift_table", title: "礼盒台" },
    ];
    cookerTabs.forEach((tab, index) => {
      const selected = tab.id === this.selectedCooker;
      this.button(root, tab.title, 104, 30, -112 + index * 112, top - 116, () => {
        this.selectedCooker = tab.id;
        this.recipePage = 0;
        this.render();
      }, true, selected ? COLORS.surfaceGreen : COLORS.surface, selected ? COLORS.green : COLORS.muted, selected ? COLORS.greenSoft : COLORS.line);
    });
    const deviceRecipes = recipes.filter((recipe) => recipe.cooker === this.selectedCooker);
    const pageCount = Math.max(1, Math.ceil(deviceRecipes.length / RECIPE_PAGE_SIZE));
    this.recipePage = Math.min(this.recipePage, pageCount - 1);
    if (pageCount > 1) {
      this.button(root, "<", 32, 28, -52, top - 154, () => {
        this.recipePage = Math.max(0, this.recipePage - 1);
        this.render();
      }, this.recipePage > 0, COLORS.surface, COLORS.green, COLORS.line);
      this.label(root, `${this.recipePage + 1}/${pageCount}`, 11, COLORS.muted, 0, top - 154, 52, 24);
      this.button(root, ">", 32, 28, 52, top - 154, () => {
        this.recipePage = Math.min(pageCount - 1, this.recipePage + 1);
        this.render();
      }, this.recipePage < pageCount - 1, COLORS.surface, COLORS.green, COLORS.line);
    }
    const startY = top - (pageCount > 1 ? 194 : 164);
    deviceRecipes.slice(this.recipePage * RECIPE_PAGE_SIZE, (this.recipePage + 1) * RECIPE_PAGE_SIZE).forEach((recipe, index) => {
      const y = startY - index * 70;
      const cooker = this.state.cookers[recipe.cooker];
      const ownsInputs = hasItems(this.state, recipe.inputs);
      const isCurrent = cooker.recipeId === recipe.id;
      const ready = isCurrent && !!cooker.readyAt && this.runtime.now() >= cooker.readyAt;
      const occupied = !!cooker.recipeId && !isCurrent;
      const remaining = isCurrent && cooker.readyAt ? Math.max(0, Math.ceil((cooker.readyAt - this.runtime.now()) / 1000)) : 0;
      const guided = this.state.guidedRecipeId === recipe.id;
      this.panel(root, 354, 62, COLORS.surface, 0, y, 6, guided ? COLORS.gold : COLORS.line);
      this.label(root, `${recipe.name} · ${cookerNames[recipe.cooker]}`, 13, COLORS.ink, -73, y + 14, 198, 22, Label.HorizontalAlign.LEFT);
      this.label(root, recipe.inputs.map((itemId) => itemById[itemId].name).join(" + "), 10, COLORS.muted, -73, y - 13, 198, 28, Label.HorizontalAlign.LEFT);
      const action = ready ? "收取" : isCurrent ? "加速" : occupied ? "占用" : ownsInputs ? "制作" : "缺材料";
      const enabled = ready || isCurrent || (!occupied && !isCurrent);
      this.button(root, action, 82, 32, 132, y, () => {
        if (ready) {
          this.applyState(collectCooker(this.state, recipe.cooker, this.runtime.now()), "recipe_collect", { recipeId: recipe.id });
        } else if (isCurrent) {
          void this.rewardCooker(recipe.cooker);
        } else if (ownsInputs && !occupied && !isCurrent) {
          this.applyState(startRecipe(this.state, recipe.id, this.runtime.now()), "recipe_start", { recipeId: recipe.id });
        } else if (!ownsInputs) {
          const missing = recipe.inputs.find((itemId, needIndex) => {
            const required = recipe.inputs.slice(0, needIndex + 1).filter((candidate) => candidate === itemId).length;
            return this.state.board.filter((item) => item?.itemId === itemId).length < required;
          }) ?? recipe.inputs[0];
          this.currentView = "atlas";
          this.applyState(guideMaterialSource(focusAtlasItem(this.state, missing), missing));
        }
      }, enabled, ready || ownsInputs || isCurrent ? COLORS.surfaceGreen : COLORS.disabled, ready || ownsInputs || isCurrent ? COLORS.green : COLORS.muted, guided ? COLORS.gold : COLORS.line);
      if (isCurrent && !ready) {
        this.label(root, `剩余 ${remaining}s`, 9, COLORS.muted, 132, y - 23, 82, 16);
      }
    });
  }

  private async rewardEnergy(): Promise<void> {
    const result = await this.application?.showRewardedVideo("energy");
    if (result === "completed") {
      this.applyState(addEnergyReward(this.state));
      return;
    }
    this.applyState({ ...this.state, message: result === "skipped" ? "完整观看后才会补充体力。" : "暂时没有可用广告，请稍后再试。" });
  }

  private async rewardCooker(cookerId: "steamer" | "pan" | "gift_table"): Promise<void> {
    const result = await this.application?.showRewardedVideo("cooker");
    if (result === "completed") {
      this.applyState(accelerateCooker(this.state, cookerId, this.runtime.now()));
      return;
    }
    this.applyState({ ...this.state, message: result === "skipped" ? "完整观看后才能完成加速。" : "暂时没有可用广告，请稍后再试。" });
  }

  private renderShop(root: Node): void {
    const top = this.visibleHeight() / 2;
    this.sectionTitle(root, "小店修复", `故事点 ${this.state.storyPoints} · 当前升级只改变店铺表现`);
    const startY = top - 148;
    shopUpgrades.forEach((area, index) => {
      const y = startY - index * 102;
      const current = this.state.shop[area.id];
      const currentDef = area.levels.find((level) => level.level === current)!;
      const target = area.levels.find((level) => level.level === current + 1);
      const affordable = !!target && this.state.coins >= target.coinCost && this.state.storyPoints >= target.storyCost;
      this.panel(root, 354, 92, COLORS.surface, 0, y, 6, affordable ? COLORS.gold : COLORS.line);
      this.label(root, `${area.name} Lv.${current} · ${currentDef.title}`, 14, COLORS.ink, -68, y + 25, 208, 24, Label.HorizontalAlign.LEFT);
      this.label(root, currentDef.effect, 10, COLORS.muted, -68, y - 1, 208, 30, Label.HorizontalAlign.LEFT);
      this.label(root, target ? `${target.coinCost} 金币 / ${target.storyCost} 故事点` : "MVP 已满级", 10, COLORS.gold, -68, y - 30, 208, 22, Label.HorizontalAlign.LEFT);
      this.button(root, target ? "修复" : "满级", 82, 34, 132, y, () => {
        if (target) this.applyState(upgradeShop(this.state, area.id), "shop_upgrade", { areaId: area.id, targetLevel: target.level });
      }, !!target, affordable ? new Color(255, 244, 214, 255) : COLORS.disabled, affordable ? COLORS.gold : COLORS.muted, affordable ? COLORS.gold : COLORS.line);
    });
  }

  private renderAtlas(root: Node): void {
    const top = this.visibleHeight() / 2;
    const focusId = this.state.atlasFocusItemId;
    if (!focusId || !itemById[focusId]) {
      this.sectionTitle(root, "合成图谱", "从订单或制作缺料提示进入");
      this.label(root, "先在订单里点“查来源”，这里会定位具体材料。", 14, COLORS.muted, 0, 40, 330, 80);
      return;
    }
    const focus = itemById[focusId];
    const chain = items.filter((item) => item.chain === focus.chain && item.level <= 5);
    this.sectionTitle(root, `图谱 · ${focus.name}`, `当前持有 ${this.state.board.filter((item) => item?.itemId === focusId).length}`);
    this.label(root, "合成路径", 13, COLORS.ink, -145, top - 136, 90, 24, Label.HorizontalAlign.LEFT);
    chain.forEach((item, index) => {
      const y = top - 181 - index * 62;
      const highlighted = item.id === focusId;
      this.panel(root, 300, 50, highlighted ? new Color(255, 244, 214, 255) : COLORS.surface, -18, y, 6, highlighted ? COLORS.gold : COLORS.line);
      this.label(root, `Lv.${item.level}  ${item.name}`, 13, highlighted ? COLORS.gold : COLORS.ink, -44, y, 220, 30, Label.HorizontalAlign.LEFT);
      if (index < chain.length - 1) this.label(root, "2 合 1", 9, COLORS.muted, 147, y - 30, 50, 18);
    });
    const recipe = recipes.find((candidate) => candidate.output === focusId);
    const base = chain[0];
    const sourceText = recipe
      ? `${focus.name}由${cookerNames[recipe.cooker]}制作，需要 ${recipe.inputs.map((itemId) => itemById[itemId].name).join(" + ")}。`
      : `${focus.name}从${base?.name ?? "基础材料"}开始，两件相同物品合成高一级。`;
    this.label(root, sourceText, 12, COLORS.muted, 0, -this.visibleHeight() / 2 + 122, 330, 52);
    this.button(root, recipe ? "去制作" : "去取材", 140, 38, 0, -this.visibleHeight() / 2 + 82, () => {
      if (recipe) {
        this.selectedCooker = recipe.cooker;
        const deviceRecipes = recipes.filter((candidate) => candidate.cooker === recipe.cooker);
        this.recipePage = Math.floor(Math.max(0, deviceRecipes.findIndex((candidate) => candidate.id === recipe.id)) / RECIPE_PAGE_SIZE);
      }
      this.currentView = recipe ? "craft" : "board";
      this.render();
    }, true, COLORS.surfaceGreen, COLORS.green, COLORS.greenSoft);
  }

  private renderTutorial(): void {
    const root = this.createRoot();
    const tutorial = this.state.tutorial!;
    const top = this.visibleHeight() / 2;
    const bottom = -this.visibleHeight() / 2;
    this.panel(root, DESIGN_WIDTH, 62, COLORS.surface, 0, top - 31, 0, COLORS.line);
    this.label(root, `新手教学  ${tutorial.step + 1}/4`, 19, COLORS.ink, 0, top - 31, 230, 34);
    if (tutorial.resumeAvailable) {
      this.button(root, "返回", 64, 32, -160, top - 31, () => {
        this.currentView = "board";
        this.applyState(returnToShop(this.state));
      }, true, COLORS.surface, COLORS.green, COLORS.line);
    }

    const prompts = [
      "合成：依次点两片菜叶，做出小青菜",
      "取材：点击菜篮，让新材料进入棋盘",
      "订单：追踪“街坊早餐”，明确合成目标",
      "完成：正式小店会把任务、订单和制作分入口展示",
    ];
    this.label(root, prompts[tutorial.step], 14, COLORS.ink, 0, top - 92, 342, 48);

    const board = tutorial.board ?? [];
    const cellSize = 68;
    const gap = 6;
    const boardCenterY = 54;
    board.forEach((cell, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const node = this.uiNode(`TutorialCell-${index}`);
      node.setPosition(new Vec3((column - 1.5) * (cellSize + gap), boardCenterY + (1.5 - row) * (cellSize + gap)));
      root.addChild(node);
      node.addComponent(UITransform).setContentSize(cellSize, cellSize);
      const selected = tutorial.selectedCell === index;
      this.panel(node, cellSize, cellSize, cell ? this.colorFromHex(itemById[cell.itemId].color, 48) : COLORS.surface, 0, 0, 7, selected ? COLORS.pink : COLORS.line);
      if (cell) {
        const item = itemById[cell.itemId];
        this.renderItem(node, item.id, cellSize, cellSize);
      }
      node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => {
        if (tutorial.step === 0) this.applyState(selectTutorialCell(this.state, index), "tutorial_step", { step: 0, action: "cell" });
      });
    });

    if (tutorial.step === 1) {
      this.button(root, "菜篮\n点击取材", 150, 54, 0, bottom + 153, () => {
        this.applyState(useTutorialGenerator(this.state), "tutorial_step", { step: 1, action: "generator" });
      }, true, COLORS.surfaceGreen, COLORS.green, COLORS.greenSoft);
    } else if (tutorial.step === 2) {
      this.button(root, "追踪街坊早餐", 180, 44, 0, bottom + 153, () => {
        this.applyState(confirmTutorialOrder(this.state), "tutorial_step", { step: 2, action: "track_order" });
      }, true, new Color(244, 238, 249, 255), COLORS.pink, COLORS.pink);
    }

    const canContinue = tutorial.actionDone || tutorial.step === 3;
    this.button(root, tutorial.step === 3 ? "进入小店" : "下一步", 180, 42, 0, bottom + 88, () => {
      if (tutorial.step === 3) {
        this.currentView = "board";
        this.applyState(completeTutorial(this.state), "tutorial_complete", { replay: !!tutorial.resumeAvailable });
      } else if (canContinue) {
        this.applyState(setTutorialStep(this.state, tutorial.step + 1), "tutorial_step", { step: tutorial.step + 1 });
      }
    }, canContinue, canContinue ? COLORS.green : COLORS.disabled, Color.WHITE, canContinue ? COLORS.green : COLORS.line);
    this.renderToast(root, top - 136);
  }

  private sectionTitle(root: Node, title: string, subtitle: string): void {
    const top = this.visibleHeight() / 2;
    this.label(root, title, 18, COLORS.ink, -86, top - 88, 180, 30, Label.HorizontalAlign.LEFT);
    this.label(root, subtitle, 10, COLORS.muted, 83, top - 88, 160, 30, Label.HorizontalAlign.RIGHT);
  }

  private renderStoryDialog(root: Node): void {
    const story = this.state.pendingStory;
    if (!story) return;
    const customer = customerById[story.customerId];
    this.panel(root, DESIGN_WIDTH, this.visibleHeight(), new Color(28, 36, 31, 118), 0, 0);
    this.panel(root, 330, 220, COLORS.surface, 0, 12, 7, COLORS.greenSoft);
    this.label(root, `${customer.name} · 街坊故事 ${story.chapter}`, 18, COLORS.ink, 0, 76, 286, 32);
    this.label(root, customer.role, 11, COLORS.muted, 0, 48, 260, 22);
    this.label(root, story.line, 14, COLORS.ink, 0, 4, 274, 68);
    this.button(root, "收下心意", 140, 38, 0, -64, () => {
      this.applyState(dismissStory(this.state));
    }, true, COLORS.surfaceGreen, COLORS.green, COLORS.greenSoft);
  }

  private renderToast(root: Node, y?: number): void {
    if (!this.toastText) return;
    const top = this.visibleHeight() / 2;
    const bottom = -this.visibleHeight() / 2;
    const toastY = y ?? (this.currentView === "board" ? top - 82 : this.currentView === "atlas" ? top - 132 : bottom + 78);
    this.panel(root, 340, 38, new Color(45, 62, 52, 238), 0, toastY, 6);
    this.label(root, this.toastText, 11, Color.WHITE, 0, toastY, 320, 30);
  }

  private button(
    parent: Node,
    title: string,
    width: number,
    height: number,
    x: number,
    y: number,
    onTap: () => void,
    enabled = true,
    fill = COLORS.surfaceGreen,
    textColor = COLORS.green,
    stroke = COLORS.greenSoft,
  ): Node {
    const button = this.uiNode(`Button-${title.slice(0, 10)}`);
    button.setPosition(new Vec3(x, y));
    parent.addChild(button);
    button.addComponent(UITransform).setContentSize(width, height);
    this.panel(button, width, height, enabled ? fill : COLORS.disabled, 0, 0, 6, enabled ? stroke : COLORS.line);
    this.label(button, title, title.includes("\n") ? 12 : 11, enabled ? textColor : COLORS.muted, 0, 0, width - 8, height - 4);
    if (enabled) button.on(Node.EventType.TOUCH_END, (_event: EventTouch) => onTap());
    return button;
  }

  private panel(
    parent: Node,
    width: number,
    height: number,
    fill: Color,
    x: number,
    y: number,
    radius = 0,
    stroke?: Color,
  ): Graphics {
    const node = parent.getComponent(Graphics) ? parent : this.uiNode("Panel");
    if (node !== parent) {
      node.setPosition(new Vec3(x, y));
      parent.addChild(node);
    }
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.strokeColor = stroke ?? fill;
    graphics.lineWidth = stroke ? 1 : 0;
    if (radius > 0) graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    else graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    if (stroke) graphics.stroke();
    return graphics;
  }

  private label(
    parent: Node,
    text: string,
    size: number,
    color: Color,
    x: number,
    y: number,
    width: number,
    height: number,
    align = Label.HorizontalAlign.CENTER,
  ): Label {
    const node = this.uiNode(`Label-${text.slice(0, 8)}`);
    node.setPosition(new Vec3(x, y));
    parent.addChild(node);
    node.addComponent(UITransform).setContentSize(width, height);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = size;
    label.lineHeight = Math.max(size + 2, 16);
    label.color = color;
    label.horizontalAlign = align;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    return label;
  }

  private colorFromHex(hex: string, alphaMix = 0): Color {
    const value = Number.parseInt(hex.replace("#", ""), 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    if (!alphaMix) return new Color(red, green, blue, 255);
    const mix = alphaMix / 100;
    return new Color(
      Math.round(red * mix + 255 * (1 - mix)),
      Math.round(green * mix + 255 * (1 - mix)),
      Math.round(blue * mix + 255 * (1 - mix)),
      255,
    );
  }

  private renderItem(parent: Node, itemId: ItemId, width: number, height: number): void {
    const item = itemById[itemId];
    const frame = this.itemSprites.get(itemId);
    if (!frame) {
      this.label(parent, `${item.name}\nLv.${item.level}`, height > 55 ? 11 : 10, COLORS.ink, 0, 0, width - 4, height - 3);
      return;
    }

    const iconSize = Math.min(width - 8, height - 16);
    const icon = this.uiNode(`Icon-${itemId}`);
    icon.setPosition(new Vec3(0, 4));
    parent.addChild(icon);
    const sprite = icon.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.RAW;
    const scale = iconSize / 128;
    icon.setScale(new Vec3(scale, scale, 1));
    this.label(parent, item.name, height > 55 ? 9 : 8, COLORS.ink, 0, -height / 2 + 8, width - 3, 13);
  }

  private uiNode(name: string): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    return node;
  }
}
