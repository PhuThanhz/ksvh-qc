import { Button, Flex, Segmented } from 'antd'
import { useMemo, useState } from 'react'
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
  /** Mở báo cáo xếp hạng đầy đủ. */
  onViewAll?: () => void
}

type Mode = 'lowest' | 'highest'

const TOP = 10
const ROW_HEIGHT = 30
const PASS_THRESHOLD = 85
const GOOD_THRESHOLD = 90

/** Màu theo mức tuân thủ: ≥90% tốt, 85–89% đạt chuẩn, <85% cần chú ý. */
const bandColor = (score: number) =>
  score >= GOOD_THRESHOLD ? CHART_COLORS.status.good : score >= PASS_THRESHOLD ? CHART_COLORS.series[0] : CHART_COLORS.status.serious

/**
 * Điểm tuân thủ theo nhà hàng (Slide 1 PDF KSVH): chỉ hiện 10 cơ sở thấp nhất (mặc định – cần chú ý) hoặc cao nhất,
 * trục co theo dữ liệu để thấy rõ chênh lệch, tô màu theo mức. Danh sách đủ xem ở Báo cáo › Xếp hạng nhà hàng.
 */
export function RestaurantComplianceChart({ data, periodLabel, loading, onSelectRestaurant, onViewAll }: Props) {
  const [mode, setMode] = useState<Mode>('lowest')
  const scored = useMemo(
    () =>
      (data ?? [])
        .filter((r): r is RestaurantComplianceItem & { complianceScore: number } => r.complianceScore != null)
        .sort((a, b) => a.complianceScore - b.complianceScore),
    [data],
  )
  const shown = useMemo(
    () => (mode === 'lowest' ? scored.slice(0, TOP) : [...scored].reverse().slice(0, TOP)),
    [scored, mode],
  )
  const bands = {
    good: scored.filter((r) => r.complianceScore >= GOOD_THRESHOLD).length,
    pass: scored.filter((r) => r.complianceScore >= PASS_THRESHOLD && r.complianceScore < GOOD_THRESHOLD).length,
    low: scored.filter((r) => r.complianceScore < PASS_THRESHOLD).length,
  }
  const notInspected = (data?.length ?? 0) - scored.length
  const chartHeight = Math.max(160, shown.length * ROW_HEIGHT + 24)

  const option = useMemo(() => {
    const min = shown.length ? Math.max(0, Math.floor((Math.min(...shown.map((r) => r.complianceScore)) - 5) / 10) * 10) : 0
    return {
      grid: { left: 8, right: 52, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { dataIndex: number }) => {
          const item = shown[p.dataIndex]
          if (!item) return ''
          const status = item.complianceScore < PASS_THRESHOLD
            ? '<span style="color:#ea580c;font-weight:600">Cần chú ý cải thiện (&lt;85%)</span>'
            : '<span style="color:#16a34a;font-weight:600">Đạt chuẩn (≥85%)</span>'
          return `<b>${item.name}</b> (${item.code})<br/>Điểm tuân thủ: <b>${item.complianceScore}%</b><br/>${status}<br/><span style="color:#94a3b8">Nhấp để xem biên bản</span>`
        },
      },
      xAxis: { ...valueAxis, min, max: 100, splitNumber: 4, axisLabel: { ...axisLabel, formatter: '{value}%', hideOverlap: true } },
      yAxis: {
        type: 'category',
        inverse: true,
        data: shown.map((r) => r.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...axisLabel, fontSize: 12, color: CHART_COLORS.text, width: 200, overflow: 'truncate' },
      },
      series: [
        {
          name: 'Điểm tuân thủ',
          type: 'bar',
          barWidth: 14,
          data: shown.map((r) => ({ value: r.complianceScore, itemStyle: { color: bandColor(r.complianceScore), borderRadius: [0, 4, 4, 0] } })),
          label: { show: true, position: 'right', formatter: '{c}%', color: CHART_COLORS.text, fontWeight: 600, fontSize: 12 },
          markLine: min < PASS_THRESHOLD
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: { type: 'dashed', color: CHART_COLORS.status.good, width: 1.5 },
                data: [{ xAxis: PASS_THRESHOLD }],
                label: { formatter: 'Chuẩn 85%', position: 'end', color: CHART_COLORS.status.good, fontSize: 11 },
              }
            : undefined,
        },
      ],
    }
  }, [shown])

  const subtitle =
    `${scored.length} cơ sở có kiểm tra trong ${periodLabel}` +
    ` · ≥90%: ${bands.good} · 85–89%: ${bands.pass} · <85%: ${bands.low}` +
    (notInspected > 0 ? ` · ${notInspected} chưa kiểm tra` : '')

  return (
    <ChartCard
      title="Điểm tuân thủ theo cơ sở"
      subtitle={subtitle}
      loading={loading}
      empty={!loading && scored.length === 0}
      emptyText={`Chưa có đợt kiểm tra nào trong ${periodLabel}`}
      height={chartHeight}
      extra={
        <Flex align="center" gap={8}>
          <Segmented<Mode>
            size="small"
            value={mode}
            onChange={setMode}
            options={[{ label: `${TOP} thấp nhất`, value: 'lowest' }, { label: `${TOP} cao nhất`, value: 'highest' }]}
          />
          {onViewAll && <Button type="link" size="small" onClick={onViewAll}>Xem đủ</Button>}
        </Flex>
      }
    >
      <EChart
        option={option}
        height={chartHeight}
        ariaLabel="Biểu đồ điểm tuân thủ theo nhà hàng"
        onEvents={
          onSelectRestaurant
            ? {
                click: (p: unknown) => {
                  const item = shown[(p as { dataIndex?: number })?.dataIndex ?? -1]
                  if (item) onSelectRestaurant(item)
                },
              }
            : undefined
        }
      />
    </ChartCard>
  )
}
