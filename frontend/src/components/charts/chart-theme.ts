/**
 * Bảng màu biểu đồ (đã kiểm tra mù màu bằng validator của skill dataviz).
 * - SERIES: màu phân loại, gán theo thứ tự cố định, không xoay vòng.
 * - RAMP: một màu xanh từ nhạt → đậm cho dữ liệu có thứ tự (mức ảnh hưởng 1–5).
 * - STATUS: tốt / cảnh báo / nghiêm trọng / nguy cấp – chỉ dùng cho mức rủi ro, luôn kèm nhãn chữ.
 */
export const CHART_COLORS = {
  series: ['#2a78d6', '#eb6834', '#1baf7a'] as const,
  ramp: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'] as const,
  status: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
  text: '#0b0b0b',
  textSecondary: '#52514e',
  textMuted: '#8a8984',
  grid: '#ecebe7',
  axis: '#d9d8d3',
  surface: '#ffffff',
} as const

export const CHART_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'

/** Tooltip chung: nền trắng, viền mảnh, chữ màu chữ (không dùng màu series cho chữ). */
export const tooltipBase = {
  backgroundColor: '#ffffff',
  borderColor: '#e5e4df',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: CHART_COLORS.text, fontSize: 12, fontFamily: CHART_FONT },
  extraCssText: 'box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-radius: 8px;',
}

/** Trục danh mục / giá trị nét mảnh, lưới mờ. */
export const axisLabel = { color: CHART_COLORS.textSecondary, fontSize: 11, fontFamily: CHART_FONT }
export const valueAxis = {
  type: 'value' as const,
  minInterval: 1,
  axisLabel,
  splitLine: { lineStyle: { color: CHART_COLORS.grid } },
  axisLine: { show: false },
  axisTick: { show: false },
}

/**
 * Màu theo mức nghiêm trọng của một danh sách có thứ tự (vd. mức rủi ro trong bảng phân loại hiện hành):
 * vị trí thấp nhất → tốt, cao nhất → nguy cấp. Không gắn cứng theo mã M1–M4.
 */
export function severityColor(index: number, total: number): string {
  const s = CHART_COLORS.status
  const scale = [s.good, s.warning, s.serious, s.critical]
  if (total <= 1) return s.critical
  const pos = Math.round((index / (total - 1)) * (scale.length - 1))
  return scale[pos] ?? s.critical
}
