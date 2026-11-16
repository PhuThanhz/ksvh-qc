import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined } from '@ant-design/icons'
import { Col, Row } from 'antd'
import { useNavigate } from 'react-router'
import { KpiCard } from '@/components/data-display/KpiCard'
import { ROUTES } from '@/constants/routes'
import { useRiskLevels } from '@/features/criteria/hooks/useRiskConfig'
import { formatNumber } from '@/features/dashboard/components/chart-utils'
import { HorizontalBarChart } from '@/features/dashboard/components/HorizontalBarChart'
import { RiskLevelChart } from '@/features/dashboard/components/RiskLevelChart'
import { TrendChart } from '@/features/dashboard/components/TrendChart'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 'Bằng tháng trước' : 'Tháng trước chưa có phiếu'
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% so với tháng trước`
}

/** Phần vận hành: chỉ số chính và biểu đồ kiểm tra / lỗi. */
export function OperationsSection({ months }: { months: number }) {
  const navigate = useNavigate()
  const dash = useDashboard(months, true)
  const levels = useRiskLevels()
  const d = dash.data
  const k = d?.kpis
  const loading = dash.isLoading

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Phiếu chấm tháng này"
            icon={<FileDoneOutlined />}
            tone="blue"
            loading={loading}
            value={formatNumber(k?.inspectionsThisMonth ?? 0)}
            unit="phiếu"
            footnote={k ? `${k.restaurantsInspectedThisMonth} nhà hàng · ${delta(k.inspectionsThisMonth, k.inspectionsLastMonth)}` : undefined}
            onClick={() => navigate(ROUTES.admin.inspections)}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Lỗi đang mở"
            icon={<AlertOutlined />}
            tone="warning"
            loading={loading}
            value={formatNumber(k?.openFindings ?? 0)}
            unit="lỗi"
            footnote="Chờ xác nhận, khiếu nại, khắc phục, nghiệm thu"
            onClick={() => navigate(ROUTES.admin.findings)}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Lỗi quá hạn khắc phục"
            icon={<ClockCircleOutlined />}
            tone={(k?.overdueFindings ?? 0) > 0 ? 'critical' : 'neutral'}
            loading={loading}
            value={formatNumber(k?.overdueFindings ?? 0)}
            unit="lỗi"
            footnote={(k?.overdueFindings ?? 0) > 0 ? 'Cần đôn đốc Cửa hàng trưởng' : 'Không có lỗi quá hạn'}
            onClick={() => navigate(ROUTES.admin.findings)}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Khắc phục đúng hạn"
            icon={<CheckCircleOutlined />}
            tone="good"
            loading={loading}
            value={k?.onTimeRate == null ? '—' : `${k.onTimeRate.toLocaleString('vi-VN')}`}
            unit={k?.onTimeRate == null ? undefined : '%'}
            footnote={k?.onTimeRate == null ? 'Chưa có lỗi nào được đóng trong kỳ' : `Lỗi đã đóng trong ${months} tháng gần nhất`}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <TrendChart data={d?.trend} loading={loading} />
        </Col>
        <Col xs={24} xl={8}>
          <RiskLevelChart data={d?.openByRiskLevel} levels={levels.data} loading={loading || levels.isLoading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <HorizontalBarChart
            title="Nhà hàng rủi ro cao"
            subtitle="Tổng điểm rủi ro của lỗi đang mở"
            valueName="Điểm rủi ro"
            loading={loading}
            emptyText="Không có lỗi nào đang mở"
            rows={(d?.topRestaurants ?? []).map((r) => ({ label: r.name, value: r.riskScore, hint: `${r.openFindings} lỗi đang mở · ${r.code}` }))}
          />
        </Col>
        <Col xs={24} lg={8}>
          <HorizontalBarChart
            title="Tiêu chí vi phạm nhiều nhất"
            subtitle={`Số lỗi trong ${months} tháng (không tính lỗi bị bỏ)`}
            valueName="Số lỗi"
            loading={loading}
            emptyText="Chưa có lỗi nào trong kỳ"
            rows={(d?.topCriteria ?? []).map((c) => ({ label: `${c.key} · ${c.label}`, value: c.count }))}
          />
        </Col>
        <Col xs={24} lg={8}>
          <HorizontalBarChart
            title="Tình trạng xử lý lỗi"
            subtitle={`Lỗi phát sinh trong ${months} tháng, theo bước xử lý`}
            valueName="Số lỗi"
            loading={loading}
            emptyText="Chưa có lỗi nào trong kỳ"
            rows={(d?.findingsByStatus ?? []).map((s) => ({ label: s.label, value: s.count }))}
          />
        </Col>
      </Row>
    </>
  )
}
