import { Col, Row } from 'antd'
import { useMemo, type ReactNode } from 'react'
import { CHART_COLORS, ChartCard, EChart } from '@/components/charts'
import {
  columnOption,
  donutOption,
  horizontalBarOption,
  SEVERITY_COLORS,
} from '@/features/reports/components/report-chart-options'
import type {
  CriteriaViolationItem,
  InspectorProductivityItem,
  MonthlySummaryItem,
  RemediationStatusItem,
  RestaurantRankingItem,
} from '@/features/reports/report.types'

const H = 280
const TOP = 10

interface ChartSpec {
  title: string
  subtitle: string
  option: ReturnType<typeof donutOption>
  empty: boolean
  span?: number
}

/** Hàng biểu đồ chuẩn của trang báo cáo: 2 khung cạnh nhau (xếp dọc trên màn hình hẹp). */
function ChartRow({ charts, loading }: { charts: ChartSpec[]; loading?: boolean }): ReactNode {
  return (
    <Row gutter={[16, 16]}>
      {charts.map((c) => (
        <Col key={c.title} xs={24} lg={c.span ?? 12}>
          <ChartCard title={c.title} subtitle={c.subtitle} loading={loading} empty={c.empty} height={H}>
            <EChart option={c.option} height={H} ariaLabel={c.title} />
          </ChartCard>
        </Col>
      ))}
    </Row>
  )
}

const sum = <T,>(items: T[], pick: (i: T) => number) => items.reduce((s, i) => s + pick(i), 0)

/** Tổng hợp tháng: lỗi theo mức rủi ro từng tháng + cơ cấu mức rủi ro cả kỳ. */
export function MonthlyCharts({ items, loading }: { items: MonthlySummaryItem[]; loading?: boolean }) {
  const charts = useMemo<ChartSpec[]>(() => {
    const levels = ['m1Count', 'm2Count', 'm3Count', 'm4Count'] as const
    return [
      {
        title: 'Lỗi theo mức rủi ro từng tháng',
        subtitle: 'Số lỗi phát hiện M1 → M4, chồng theo tháng',
        span: 14,
        empty: sum(items, (i) => i.totalFindings) === 0,
        option: columnOption(items.map((i) => i.month), levels.map((k, idx) => ({
          name: `M${idx + 1}`, data: items.map((i) => i[k]), color: SEVERITY_COLORS[idx] ?? '#64748b', stack: 'lỗi',
        }))),
      },
      {
        title: 'Cơ cấu lỗi theo mức rủi ro',
        subtitle: 'Toàn bộ kỳ đang lọc',
        span: 10,
        empty: sum(items, (i) => i.totalFindings) === 0,
        option: donutOption(levels.map((k, idx) => ({ name: `M${idx + 1}`, value: sum(items, (i) => i[k]), color: SEVERITY_COLORS[idx] ?? '#64748b' })), 'lỗi'),
      },
    ]
  }, [items])
  return <ChartRow charts={charts} loading={loading} />
}

/** Xếp loại do server tính (RestaurantRankingReportService). */
const RANK_COLORS: Record<string, string> = {
  'Tốt': CHART_COLORS.status.good,
  'Đạt': CHART_COLORS.series[0],
  'Cần lưu ý': CHART_COLORS.status.warning,
  'Nguy cơ cao': CHART_COLORS.status.critical,
}

/** Xếp hạng nhà hàng: phân bố xếp loại + 10 nhà hàng tuân thủ thấp nhất cần chú ý. */
export function RankingCharts({ items, loading }: { items: RestaurantRankingItem[]; loading?: boolean }) {
  const charts = useMemo<ChartSpec[]>(() => {
    const lowest = [...items].sort((a, b) => a.complianceRate - b.complianceRate).slice(0, TOP)
    return [
      {
        title: 'Phân bố xếp loại nhà hàng',
        subtitle: 'Theo tỷ lệ tuân thủ trong kỳ',
        empty: items.length === 0,
        option: donutOption(Object.keys(RANK_COLORS).map((k) => ({
          name: k, value: items.filter((i) => i.rankCategory === k).length, color: RANK_COLORS[k],
        })), 'nhà hàng'),
      },
      {
        title: `${TOP} nhà hàng tuân thủ thấp nhất`,
        subtitle: 'Ưu tiên kiểm tra / hỗ trợ khắc phục',
        empty: lowest.length === 0,
        option: horizontalBarOption(lowest.map((i) => i.restaurantName), [
          { name: '% Tuân thủ', data: lowest.map((i) => i.complianceRate), color: CHART_COLORS.status.serious },
        ], { percent: true }),
      },
    ]
  }, [items])
  return <ChartRow charts={charts} loading={loading} />
}

/** Tiêu chí vi phạm: lỗi theo nhóm tiêu chí + tình trạng xử lý của 10 tiêu chí vi phạm nhiều nhất. */
export function CriteriaCharts({ items, loading }: { items: CriteriaViolationItem[]; loading?: boolean }) {
  const charts = useMemo<ChartSpec[]>(() => {
    const byGroup = new Map<string, number>()
    for (const i of items) byGroup.set(i.groupName ?? 'Khác', (byGroup.get(i.groupName ?? 'Khác') ?? 0) + i.violationCount)
    const top = [...items].sort((a, b) => b.violationCount - a.violationCount).slice(0, TOP)
    return [
      {
        title: 'Lỗi vi phạm theo nhóm tiêu chí',
        subtitle: 'Nhóm nào phát sinh nhiều lỗi nhất',
        empty: items.length === 0,
        option: donutOption([...byGroup].map(([name, value]) => ({ name, value })), 'lần vi phạm'),
      },
      {
        title: `Tình trạng xử lý – top ${TOP} tiêu chí`,
        subtitle: 'Số lỗi đã đóng / còn mở',
        empty: top.length === 0,
        option: horizontalBarOption(top.map((i) => `${i.criterionCode} ${i.criterionName}`), [
          { name: 'Đã đóng', data: top.map((i) => i.closedCount), color: CHART_COLORS.status.good, stack: 'xl' },
          { name: 'Còn mở', data: top.map((i) => i.openCount), color: CHART_COLORS.status.critical, stack: 'xl' },
        ]),
      },
    ]
  }, [items])
  return <ChartRow charts={charts} loading={loading} />
}

/** Tiến độ khắc phục: cơ cấu tình trạng toàn hệ thống + 10 nhà hàng tỷ lệ đúng hạn thấp nhất. */
export function RemediationCharts({ items, summary, loading }: { items: RemediationStatusItem[]; summary?: RemediationStatusItem; loading?: boolean }) {
  const charts = useMemo<ChartSpec[]>(() => {
    const s = (pick: (i: RemediationStatusItem) => number) => (summary ? pick(summary) : sum(items, pick))
    const lowest = [...items].filter((i) => i.totalFindings > 0).sort((a, b) => a.onTimeRate - b.onTimeRate).slice(0, TOP)
    return [
      {
        title: 'Tình trạng khắc phục lỗi',
        subtitle: 'Toàn bộ lỗi trong kỳ đang lọc',
        empty: s((i) => i.totalFindings) === 0,
        option: donutOption([
          { name: 'Xong đúng hạn', value: s((i) => i.resolvedOnTimeCount), color: CHART_COLORS.status.good },
          { name: 'Xong trễ hạn', value: s((i) => i.resolvedOverdueCount), color: CHART_COLORS.status.warning },
          { name: 'Đang xử lý', value: s((i) => i.inProgressCount), color: CHART_COLORS.series[0] },
          { name: 'Quá hạn chưa xong', value: s((i) => i.overdueOpenCount), color: CHART_COLORS.status.critical },
        ], 'lỗi'),
      },
      {
        title: `${TOP} nhà hàng khắc phục đúng hạn thấp nhất`,
        subtitle: 'Tỷ lệ lỗi xử lý xong đúng hạn',
        empty: lowest.length === 0,
        option: horizontalBarOption(lowest.map((i) => i.restaurantName), [
          { name: '% Đúng hạn', data: lowest.map((i) => i.onTimeRate), color: CHART_COLORS.status.warning },
        ], { percent: true }),
      },
    ]
  }, [items, summary])
  return <ChartRow charts={charts} loading={loading} />
}

/** Năng suất chuyên viên: phiếu được giao / hoàn thành + lỗi phát hiện (tách M3–M4) theo người. */
export function InspectorCharts({ items, loading }: { items: InspectorProductivityItem[]; loading?: boolean }) {
  const charts = useMemo<ChartSpec[]>(() => {
    const names = items.map((i) => i.inspectorFullName || i.inspectorUsername)
    return [
      {
        title: 'Phiếu được giao và đã hoàn thành',
        subtitle: 'Theo từng chuyên viên KSVH',
        empty: items.length === 0,
        option: horizontalBarOption(names, [
          { name: 'Được giao', data: items.map((i) => i.totalAssigned), color: '#cbd5e1' },
          { name: 'Hoàn thành', data: items.map((i) => i.completedInspections), color: CHART_COLORS.series[0] },
        ]),
      },
      {
        title: 'Lỗi phát hiện theo chuyên viên',
        subtitle: 'Tách riêng lỗi nghiêm trọng M3–M4',
        empty: sum(items, (i) => i.totalFindingsFound) === 0,
        option: horizontalBarOption(names, [
          { name: 'M1–M2', data: items.map((i) => Math.max(0, i.totalFindingsFound - i.m3m4Count)), color: CHART_COLORS.status.warning, stack: 'lỗi' },
          { name: 'M3–M4', data: items.map((i) => i.m3m4Count), color: CHART_COLORS.status.critical, stack: 'lỗi' },
        ]),
      },
    ]
  }, [items])
  return <ChartRow charts={charts} loading={loading} />
}
