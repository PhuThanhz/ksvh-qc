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
  /** Nhãn kỳ đang xem (vd "6 tháng qua"), để ghi rõ trên tiêu đề phụ. */
  periodLabel: string
  loading: boolean
  onSelectRestaurant?: (restaurant: RestaurantComplianceItem) => void
}

const ROW_HEIGHT = 34
const MIN_HEIGHT = 220
const MAX_HEIGHT = 520
const PASS_THRESHOLD = 85

/**
 * Điểm tuân thủ theo nhà hàng (chuẩn Slide 1 PDF KSVH), dạng thanh ngang để tên nhà hàng không đè nhau.
 * Chỉ vẽ nhà hàng có phiếu chấm trong kỳ, điểm thấp nhất lên đầu; nhiều nhà hàng thì cuộn trong khung.
 */
export function RestaurantComplianceChart({ data, periodLabel, loading, onSelectRestaurant }: Props) {
  const scored = useMemo(
    () =>
      (data ?? [])
        .filter((r): r is RestaurantComplianceItem & { complianceScore: number } => r.complianceScore != null)
        .sort((a, b) => a.complianceScore - b.complianceScore),
    [data],
  )
  const notInspected = (data?.length ?? 0) - scored.length
  const chartHeight = Math.max(MIN_HEIGHT, scored.length * ROW_HEIGHT + 40)
  const frameHeight = Math.min(chartHeight, MAX_HEIGHT)

  const option = useMemo(() => {
    // ECharts vẽ trục danh mục từ dưới lên: đảo để phần tử đầu (điểm thấp nhất) nằm trên cùng.
    const rows = [...scored].reverse()
    return {
      grid: { left: 8, right: 48, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { dataIndex: number }) => {
          const item = rows[p.dataIndex]
          if (!item) return ''
          const status = item.attention
            ? '<span style="color:#f97316;font-weight:600">Cần chú ý cải thiện (&lt;85%)</span>'
            : '<span style="color:#10b981;font-weight:600">Đạt chuẩn chất lượng (≥85%)</span>'
          return `<b>${item.name}</b> (${item.code})<br/>Điểm tuân thủ: <b>${item.complianceScore}%</b><br/>Đánh giá: ${status}`
        },
      },
      xAxis: {
        ...valueAxis,
        max: 100,
        axisLabel: { formatter: '{value}%', color: CHART_COLORS.textSecondary, fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: rows.map((item) => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...axisLabel, fontSize: 12, color: CHART_COLORS.text, width: 200, overflow: 'truncate' },
      },
      series: [
        {
          name: 'Điểm tuân thủ',
          type: 'bar',
          barWidth: 16,
          data: rows.map((item) => ({
            value: item.complianceScore,
            itemStyle: {
              color: item.attention ? '#f97316' : '#2563eb',
              borderRadius: [0, 4, 4, 0],
            },
          })),
          showBackground: true,
          backgroundStyle: { color: '#f1f5f9', borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: CHART_COLORS.text,
            fontWeight: 600,
            fontSize: 12,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#10b981', width: 1.5 },
            data: [{ xAxis: PASS_THRESHOLD, name: 'Ngưỡng đạt chuẩn (85%)' }],
            label: { formatter: 'Chuẩn 85%', position: 'end', color: '#10b981', fontSize: 11 },
          },
        },
      ],
    }
  }, [scored])

  const empty = !loading && scored.length === 0
  const subtitle =
    `Cơ sở có đợt kiểm tra trong ${periodLabel}, xếp hạng theo điểm tuân thủ` +
    (notInspected > 0 ? ` · ${notInspected} cơ sở chưa kiểm tra` : '')

  return (
    <ChartCard
      title="Điểm tuân thủ theo cơ sở"
      subtitle={subtitle}
      loading={loading}
      empty={empty}
      emptyText={`Chưa có đợt kiểm tra nào trong ${periodLabel}`}
      height={frameHeight}
    >
      <div style={{ maxHeight: MAX_HEIGHT, overflowX: 'hidden', overflowY: chartHeight > MAX_HEIGHT ? 'auto' : 'hidden' }}>
        <EChart
          option={option}
          height={chartHeight}
          ariaLabel="Biểu đồ thanh ngang Điểm tuân thủ theo nhà hàng"
          onEvents={
            onSelectRestaurant
              ? {
                  click: (p: unknown) => {
                    const idx = (p as { dataIndex?: number })?.dataIndex ?? -1
                    const item = [...scored].reverse()[idx]
                    if (item) onSelectRestaurant(item)
                  },
                }
              : undefined
          }
        />
      </div>
    </ChartCard>
  )
}
