/** Kích thước nút thao tác (khớp .action-btn trong global.css) và khoảng cách giữa các nút (TableActions gap). */
const ACTION_BUTTON_PX = 32
const ACTION_GAP_PX = 6
/** Lề trái + phải của ô bảng (td padding 14px × 2) và viền. */
const CELL_PADDING_PX = 30

/**
 * Độ rộng cột "Thao tác" vừa khít đúng số nút, để mọi bảng đồng bộ và không thừa khoảng trống.
 * Truyền số nút tối đa có thể hiện trên một dòng.
 */
export function actionColumnWidth(buttons: number): number {
  const n = Math.max(1, buttons)
  return n * ACTION_BUTTON_PX + (n - 1) * ACTION_GAP_PX + CELL_PADDING_PX
}
