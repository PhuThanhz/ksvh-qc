import { useMemo } from 'react'
import { CHART_COLORS, ChartCard, EChart, tooltipBase, valueAxis } from '@/components/charts'

export interface BarRow {
  label: string
  value: number
  /** Dòng phụ trong tooltip. */
  hint?: string
  id?: number | string
}

interface Props {
  title: string
  subtitle: string
  rows: readonly BarRow[]
  loading: boolean
  emptyText: string
  valueName: string
  height?: number
  onRowClick?: (row: BarRow) => void
}

/** Thanh ngang một màu, sắp theo thứ tự truyền vào; hỗ trợ nhấp để lọc. */
export function HorizontalBarChart({
  title,
  subtitle,
  rows,
  loading,
  emptyText,
  valueName,
  height = 240,
  onRowClick,
}: Props) {
  const ordered = useMemo(() => [...rows].reverse(), [rows])

  const option = useMemo(() => {
    return {
      grid: { left: 8, right: 40, top: 4, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { dataIndex: number }) => {
          const r = ordered[p.dataIndex]
          return r ? `<b>${r.label}</b><br/>${valueName}: <b>${r.value.toLocaleString('vi-VN')}</b>${r.hint ? `<br/>${r.hint}` : ''}` : ''
        },
      },
      xAxis: { ...valueAxis, splitLine: { show: false }, axisLabel: { show: false } },
      yAxis: {
        type: 'category',
        data: ordered.map((r) => r.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: CHART_COLORS.text, fontSize: 12, width: 160, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 14,
          data: ordered.map((r) => r.value),
          itemStyle: { color: CHART_COLORS.series[0], borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: CHART_COLORS.textSecondary, fontSize: 12 },
          showBackground: true,
          backgroundStyle: { color: '#f1f5f9', borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }, [ordered, valueName])

  const empty = !loading && rows.every((r) => r.value === 0)
  return (
    <ChartCard title={title} subtitle={subtitle} loading={loading} empty={empty} emptyText={emptyText} height={height}>
      <EChart
        option={option}
        height={height}
        ariaLabel={`Biểu đồ thanh: ${title}`}
        onEvents={
          onRowClick
            ? {
                click: (p: unknown) => {
                  const idx = (p as { dataIndex?: number })?.dataIndex ?? -1
                  const r = ordered[idx]
                  if (r) onRowClick(r)
                },
              }
            : undefined
        }
      />
    </ChartCard>
  )
}
