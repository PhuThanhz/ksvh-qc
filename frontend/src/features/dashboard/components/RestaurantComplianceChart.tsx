import { useMemo } from 'react'
import { axisLabel, CHART_COLORS, ChartCard, EChart, tooltipBase, valueAxis } from '@/components/charts'

export interface RestaurantComplianceItem {
  id: number
  code: string
  name: string
  complianceScore: number | null
  attention: boolean
}

interface Props {
  data?: readonly RestaurantComplianceItem[]
  loading: boolean
  onSelectRestaurant?: (restaurant: RestaurantComplianceItem) => void
}

/** Biểu đồ cột Điểm tuân thủ theo nhà hàng (chuẩn Slide 1 PDF KSVH). */
export function RestaurantComplianceChart({ data, loading, onSelectRestaurant }: Props) {
  const option = useMemo(() => {
    const list = data ?? []
    return {
      grid: { left: 8, right: 16, top: 28, bottom: 48, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { dataIndex: number }) => {
          const item = list[p.dataIndex]
          if (!item) return ''
          const score = item.complianceScore != null ? `${item.complianceScore}%` : 'Chưa có dữ liệu'
          const status = item.attention
            ? '<span style="color:#f97316;font-weight:600">Cần chú ý cải thiện (&lt;85%)</span>'
            : '<span style="color:#10b981;font-weight:600">Đạt chuẩn chất lượng (≥85%)</span>'
          return `<b>${item.name}</b> (${item.code})<br/>Điểm tuân thủ: <b>${score}</b><br/>Đánh giá: ${status}`
        },
      },
      xAxis: {
        type: 'category',
        data: list.map((item) => item.name),
        axisLabel: {
          ...axisLabel,
          interval: 0,
          rotate: 20,
          fontSize: 11,
          lineHeight: 14,
          formatter: (value: string) => (value.length > 20 ? `${value.slice(0, 18)}…` : value),
        },
        axisLine: { lineStyle: { color: CHART_COLORS.axis } },
        axisTick: { show: false },
      },
      yAxis: {
        ...valueAxis,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: CHART_COLORS.textSecondary,
        },
      },
      series: [
        {
          name: 'Điểm tuân thủ',
          type: 'bar',
          barWidth: 32,
          data: list.map((item) => ({
            value: item.complianceScore ?? 0,
            itemStyle: {
              color: item.attention ? '#f97316' : '#0f172a',
              borderRadius: [4, 4, 0, 0],
            },
          })),
          label: {
            show: true,
            position: 'top',
            formatter: (p: { value: number }) => (p.value > 0 ? `${p.value}%` : ''),
            color: CHART_COLORS.text,
            fontWeight: 600,
            fontSize: 12,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#10b981', width: 1.5 },
            data: [{ yAxis: 85, name: 'Ngưỡng đạt chuẩn (85%)' }],
            label: {
              formatter: 'Chuẩn 85%',
              position: 'insideEndTop',
              color: '#10b981',
              fontSize: 11,
            },
          },
        },
      ],
    }
  }, [data])

  const empty = !loading && (!data || data.length === 0)

  return (
    <ChartCard
      title="Điểm tuân thủ theo nhà hàng"
      subtitle="Đo lường mức độ tuân thủ tiêu chuẩn chất lượng theo từng cơ sở (Slide 1 PDF)"
      loading={loading}
      empty={empty}
      emptyText="Chưa có dữ liệu kiểm tra trong kỳ"
      height={300}
    >
      <EChart
        option={option}
        height={300}
        ariaLabel="Biểu đồ cột Điểm tuân thủ theo nhà hàng"
        onEvents={
          onSelectRestaurant
            ? {
                click: (p: unknown) => {
                  const idx = (p as { dataIndex?: number })?.dataIndex ?? -1
                  const item = (data ?? [])[idx]
                  if (item) onSelectRestaurant(item)
                },
              }
            : undefined
        }
      />
    </ChartCard>
  )
}
