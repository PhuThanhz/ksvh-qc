import type { EChartsCoreOption } from 'echarts/core'
import { axisLabel, CHART_COLORS, tooltipBase, valueAxis } from '@/components/charts'

/** Màu mức rủi ro M1 → M4 (tốt → nguy cấp), dùng chung cho mọi biểu đồ báo cáo. */
export const SEVERITY_COLORS = [
  CHART_COLORS.status.good,
  CHART_COLORS.status.warning,
  CHART_COLORS.status.serious,
  CHART_COLORS.status.critical,
] as const

export interface Slice {
  name: string
  value: number
  color?: string
}

/**
 * Biểu đồ vành khuyên: tổng ở giữa, bỏ lát bằng 0.
 * Chú thích luôn nằm dưới (cuộn khi nhiều mục) để không đè lên hình dù khung hẹp.
 */
export function donutOption(slices: Slice[], centerLabel: string): EChartsCoreOption {
  const data = slices.filter((s) => s.value > 0)
  const total = data.reduce((sum, s) => sum + s.value, 0)
  const center = ['50%', '42%']
  const legendText = { ...axisLabel, width: 110, overflow: 'truncate' as const }
  return {
    tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
    legend: { type: 'scroll', bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: legendText, tooltip: { show: true } },
    title: {
      text: String(total),
      subtext: centerLabel,
      left: center[0],
      top: '33%',
      textAlign: 'center',
      textStyle: { fontSize: 22, fontWeight: 600, color: CHART_COLORS.text },
      subtextStyle: { fontSize: 11, color: CHART_COLORS.textMuted },
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '60%'],
        center,
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: CHART_COLORS.surface, borderWidth: 2 },
        data: data.map((s) => ({ name: s.name, value: s.value, itemStyle: s.color ? { color: s.color } : undefined })),
      },
    ],
  }
}

export interface BarSeries {
  name: string
  data: number[]
  color: string
  stack?: string
}

/**
 * Biểu đồ cột ngang cho danh sách tên dài (nhà hàng, tiêu chí, chuyên viên):
 * nhãn trục bị cắt gọn, tooltip hiện đủ tên. Danh mục đầu tiên nằm trên cùng.
 */
export function horizontalBarOption(categories: string[], series: BarSeries[], opts?: { percent?: boolean }): EChartsCoreOption {
  const fmt = opts?.percent ? '{value}%' : '{value}'
  // Thang % co theo dữ liệu (vd 85–100%) để thấy rõ chênh lệch thay vì cột nào cũng gần đầy
  const values = series.flatMap((s) => s.data)
  const min = opts?.percent && values.length ? Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10) : undefined
  return {
    tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: series.length > 1 ? { top: 0, itemWidth: 10, itemHeight: 10, textStyle: axisLabel } : undefined,
    grid: { left: 8, right: 24, top: series.length > 1 ? 30 : 8, bottom: 8, containLabel: true },
    xAxis: { ...valueAxis, min, max: opts?.percent ? 100 : undefined, splitNumber: 4, axisLabel: { ...axisLabel, formatter: fmt, hideOverlap: true } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: categories,
      axisLabel: { ...axisLabel, width: 150, overflow: 'truncate' },
      axisLine: { lineStyle: { color: CHART_COLORS.axis } },
      axisTick: { show: false },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: s.stack,
      data: s.data,
      barMaxWidth: 16,
      label: opts?.percent ? { show: true, position: 'right', formatter: '{c}%', fontSize: 11, color: CHART_COLORS.textSecondary } : undefined,
      itemStyle: { color: s.color, borderRadius: s.stack ? 0 : [0, 4, 4, 0] },
    })),
  }
}

/** Biểu đồ cột đứng theo danh mục (tháng, chuyên viên…), có thể chồng cột. */
export function columnOption(categories: string[], series: BarSeries[]): EChartsCoreOption {
  return {
    tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, itemWidth: 10, itemHeight: 10, textStyle: axisLabel },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { ...axisLabel, interval: 0, width: 80, overflow: 'truncate' },
      axisLine: { lineStyle: { color: CHART_COLORS.axis } },
      axisTick: { show: false },
    },
    yAxis: valueAxis,
    series: series.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: s.stack,
      data: s.data,
      barMaxWidth: 28,
      itemStyle: { color: s.color },
    })),
  }
}
