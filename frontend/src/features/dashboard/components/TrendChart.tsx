import { useMemo } from 'react'
import { axisLabel, CHART_COLORS, ChartCard, EChart, tooltipBase, valueAxis } from '@/components/charts'
import { monthLabel } from '@/features/dashboard/components/chart-utils'
import type { MonthPoint } from '@/types/api.generated'

const SERIES = [
  { key: 'inspections', name: 'Biên bản kiểm tra', color: CHART_COLORS.series[0] },
  { key: 'findings', name: 'Điểm không phù hợp', color: CHART_COLORS.series[1] },
] as const

/** Xu hướng theo tháng: hai đại lượng cùng đơn vị (số lượng) trên một trục. */
export function TrendChart({ data, loading }: { data?: readonly MonthPoint[]; loading: boolean }) {
  const option = useMemo(
    () => ({
      grid: { left: 8, right: 16, top: 36, bottom: 4, containLabel: true },
      legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 4, textStyle: { color: CHART_COLORS.textSecondary, fontSize: 12 } },
      tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: CHART_COLORS.axis } } },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: (data ?? []).map((p) => monthLabel(p.month)),
        axisLabel,
        axisLine: { lineStyle: { color: CHART_COLORS.axis } },
        axisTick: { show: false },
      },
      yAxis: valueAxis,
      series: SERIES.map((s) => ({
        name: s.name,
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 2, color: s.color },
        itemStyle: { color: s.color, borderColor: '#fff', borderWidth: 2 },
        emphasis: { focus: 'series' },
        data: (data ?? []).map((p) => p[s.key]),
      })),
    }),
    [data],
  )
  const empty = !loading && (data ?? []).every((p) => p.inspections === 0 && p.findings === 0)
  return (
    <ChartCard
      title="Xu hướng kiểm tra"
      subtitle="Số biên bản kiểm tra và số điểm không phù hợp ghi nhận theo tháng"
      loading={loading}
      empty={empty}
      emptyText="Chưa có dữ liệu kiểm tra trong kỳ"
      height={280}
    >
      <EChart option={option} height={280} ariaLabel="Biểu đồ đường số biên bản kiểm tra và số điểm không phù hợp theo tháng" />
    </ChartCard>
  )
}
