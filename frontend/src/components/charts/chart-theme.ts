/**
 * Bảng màu biểu đồ chuẩn Enterprise (đã kiểm tra độ tương phản và mù màu).
 * - SERIES: màu phân loại cố định (Sky, Amber, Emerald).
 * - RAMP: thang xanh nhạt → đậm cho mức ảnh hưởng 1–5.
 * - STATUS: phân cấp nghiêm trọng M1–M4.
 */
export const CHART_COLORS = {
  series: ['#0284c7', '#f97316', '#10b981'] as const,
  ramp: ['#bae6fd', '#7dd3fc', '#38bdf8', '#0284c7', '#0369a1'] as const,
  status: { good: '#16a34a', warning: '#f59e0b', serious: '#ea580c', critical: '#dc2626' },
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  grid: '#f1f5f9',
  axis: '#cbd5e1',
  surface: '#ffffff',
} as const

export const CHART_FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

/** Tooltip chuẩn Enterprise: nền trắng, viền mảnh slate, bóng mềm. */
export const tooltipBase = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: CHART_COLORS.text, fontSize: 12, fontFamily: CHART_FONT },
  extraCssText: 'box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border-radius: 8px;',
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
 * Màu theo mức nghiêm trọng của một danh sách có thứ tự (vd. mức rủi ro hiện hành):
 * vị trí thấp nhất → tốt, cao nhất → nguy cấp.
 */
export function severityColor(index: number, total: number): string {
  const s = CHART_COLORS.status
  const scale = [s.good, s.warning, s.serious, s.critical]
  if (total <= 1) return s.critical
  const pos = Math.round((index / (total - 1)) * (scale.length - 1))
  return scale[pos] ?? s.critical
}
