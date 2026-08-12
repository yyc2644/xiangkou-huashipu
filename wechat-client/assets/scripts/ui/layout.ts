export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;
export const MIN_VISIBLE_HEIGHT = 680;

export interface MainScreenLayout {
  visibleHeight: number;
  top: number;
  bottom: number;
  headerCenterY: number;
  trackedTaskY: number;
  boardTop: number;
  boardBottom: number;
  boardCenterY: number;
  boardCellHeight: number;
  generatorY: number;
  navigationCenterY: number;
  navigationTop: number;
  toastY: number;
}

export const normalizeVisibleHeight = (height: number) => Math.max(MIN_VISIBLE_HEIGHT, height);

export const viewportToDesignHeight = (viewportWidth: number, viewportHeight: number) =>
  DESIGN_WIDTH * viewportHeight / viewportWidth;

export const computeMainScreenLayout = (rawVisibleHeight: number): MainScreenLayout => {
  const visibleHeight = normalizeVisibleHeight(rawVisibleHeight);
  const top = visibleHeight / 2;
  const bottom = -top;
  const boardTop = top - 111;
  const boardBottom = bottom + 132;
  const gap = 3;
  const boardCellHeight = Math.min(50, (boardTop - boardBottom - gap * 8) / 9);

  return {
    visibleHeight,
    top,
    bottom,
    headerCenterY: top - 31,
    trackedTaskY: top - 82,
    boardTop,
    boardBottom,
    boardCenterY: (boardTop + boardBottom) / 2,
    boardCellHeight,
    generatorY: bottom + 91,
    navigationCenterY: bottom + 27,
    navigationTop: bottom + 54,
    toastY: bottom + 78,
  };
};
