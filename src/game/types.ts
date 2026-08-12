export type ItemId = string;
export type ChainId = string;
export type GeneratorId = "veg_basket" | "flower_basket" | "market_crate";
export type CookerId = "steamer" | "pan" | "gift_table";
export type OrderId = string;
export type ShopAreaId = "signboard" | "tables" | "flower_shelf" | "kitchen";
export type CustomerId = string;
export type TaskScope = "onboarding" | "daily";
export type DailyTaskId = "daily_materials" | "daily_merges" | "daily_orders";

export interface DailyProgress {
  materials: number;
  merges: number;
  orders: number;
}

export interface GameRuntime {
  nowMs: number;
  random: () => number;
}

export interface ItemDef {
  id: ItemId;
  chain: ChainId;
  level: number;
  name: string;
  icon: string;
  color: string;
  next?: ItemId;
  sell: number;
}

export interface BoardItem {
  uid: string;
  itemId: ItemId;
}

export interface GeneratorDef {
  id: GeneratorId;
  name: string;
  icon: string;
  color: string;
  drops: ItemId[];
  maxCharges: number;
  cooldownMs: number;
}

export interface GeneratorState {
  id: GeneratorId;
  charges: number;
  readyAt: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  cooker: CookerId;
  icon: string;
  color: string;
  inputs: ItemId[];
  output: ItemId;
  durationMs: number;
}

export interface CookerState {
  id: CookerId;
  recipeId?: string;
  readyAt?: number;
  output?: ItemId;
}

export interface OrderDef {
  id: OrderId;
  title: string;
  customerId: CustomerId;
  story: boolean;
  needs: ItemId[];
  coin: number;
  xp: number;
  storyPoints: number;
}

export interface RewardDef {
  coins?: number;
  energy?: number;
  xp?: number;
  storyPoints?: number;
}

export interface ShopUpgradeDef {
  id: ShopAreaId;
  name: string;
  levels: Array<{
    level: number;
    title: string;
    coinCost: number;
    storyCost: number;
    effect: string;
  }>;
}

export interface CustomerDef {
  id: CustomerId;
  name: string;
  avatar: string;
  role: string;
  color: string;
  story: string[];
}

export interface TutorialState {
  step: number;
  open: boolean;
  completed: boolean;
  board?: Array<BoardItem | null>;
  selectedCell?: number;
  actionDone?: boolean;
  resumeAvailable?: boolean;
}

export type MilestoneId =
  | "take_material"
  | "merge_greens"
  | "complete_breakfast"
  | "start_bao"
  | "collect_bao"
  | "complete_bao_story"
  | "upgrade_signboard";

export interface StoryDialogState {
  orderId: OrderId;
  customerId: CustomerId;
  chapter: number;
  line: string;
}

export interface GameState {
  saveVersion: number;
  nextUid: number;
  board: Array<BoardItem | null>;
  generators: Record<GeneratorId, GeneratorState>;
  cookers: Record<CookerId, CookerState>;
  activeOrders: OrderId[];
  completedOrders: OrderId[];
  viewedStories: string[];
  shop: Record<ShopAreaId, number>;
  coins: number;
  energy: number;
  maxEnergy: number;
  xp: number;
  level: number;
  storyPoints: number;
  lastEnergyAt: number;
  message: string;
  selectedCell?: number;
  trackedTaskId?: string;
  trackedTaskScope?: TaskScope;
  tutorial?: TutorialState;
  milestones?: Partial<Record<MilestoneId, boolean>>;
  pendingStory?: StoryDialogState;
  claimedTaskIds?: string[];
  dayKey: string;
  dailyProgress: DailyProgress;
  dailyClaimedTaskIds: DailyTaskId[];
  atlasFocusItemId?: ItemId;
  guidedGeneratorId?: GeneratorId;
  guidedRecipeId?: string;
}
