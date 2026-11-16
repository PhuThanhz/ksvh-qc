import { useMemo } from 'react'
import { axisLabel, CHART_COLORS, ChartCard, EChart, tooltipBase, valueAxis } from '@/components/charts'

const LEVELS = [1, 2, 3, 4, 5] as const
const LABELS: Record<number, string> = { 1: 'Rất nhẹ', 2: 'Nhẹ', 3: 'Trung bình', 4: 'Nặng', 5: 'Rất nghiêm trọng' }

/** Số tiêu chí theo mức ảnh hưởng gốc 1–5: dải màu một sắc, nhạt → đậm theo mức. */
export function ImpactChart({ criteria, loading }: { criteria?: readonly { baseImpact: number }[]; loading: boolean }) {
  const counts = useMemo(() => LEVELS.map((l) => (criteria ?? []).filter((c) => c.baseImpact === l).length), [criteria])
  const option = useMemo(
    () => ({
      grid: { left: 8, right: 8, top: 24, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { dataIndex: number; value: number }) =>
          `<b>Mức ${p.dataIndex + 1}</b> – ${LABELS[p.dataIndex + 1]}<br/>Số tiêu chí: <b>${p.value}</b>`,
      },
      xAxis: {
        type: 'category',
        data: LEVELS.map((l) => `Mức ${l}`),
        axisLabel,
        axisLine: { lineStyle: { color: CHART_COLORS.axis } },
        axisTick: { show: false },
      },
      yAxis: valueAxis,
      series: [
        {
          type: 'bar',
          barWidth: '42%',
          data: counts.map((v, i) => ({ value: v, itemStyle: { color: CHART_COLORS.ramp[i], borderRadius: [4, 4, 0, 0] } })),
          label: { show: true, position: 'top', color: CHART_COLORS.textSecondary, fontSize: 12 },
        },
      ],
    }),
    [counts],
  )
  return (
    <ChartCard
      title="Tiêu chí theo mức ảnh hưởng"
      subtitle="Mức ảnh hưởng gốc 1 (rất nhẹ) → 5 (rất nghiêm trọng), tiêu chí đang dùng"
      loading={loading}
      empty={counts.every((c) => c === 0)}
      emptyText="Chưa có tiêu chí đang dùng"
      height={240}
    >
      <EChart option={option} height={240} ariaLabel="Biểu đồ cột số tiêu chí theo mức ảnh hưởng 1 đến 5" />
    </ChartCard>
  )
}
