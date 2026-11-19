import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { Col, Row } from 'antd'
import { useNavigate } from 'react-router'
import { KpiCard } from '@/components/data-display/KpiCard'
import { ROUTES } from '@/constants/routes'
import { useRiskLevels } from '@/features/criteria/hooks/useRiskConfig'
import { formatNumber } from '@/features/dashboard/components/chart-utils'
import { HorizontalBarChart } from '@/features/dashboard/components/HorizontalBarChart'
import { RestaurantComplianceChart } from '@/features/dashboard/components/RestaurantComplianceChart'
import { RiskLevelChart } from '@/features/dashboard/components/RiskLevelChart'
import { TrendChart } from '@/features/dashboard/components/TrendChart'
import type { DashboardPeriod } from '@/features/dashboard/dashboard.period'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'

/** Phần vận hành: chỉ số chính và biểu đồ tương tác chuẩn Slide 1 & quy trình PDF KSVH. */
export function OperationsSection({ period }: { period: DashboardPeriod }) {
  const navigate = useNavigate()
  const dash = useDashboard(period, true)
  const label = period.label
  const levels = useRiskLevels()
  const d = dash.data
  const k = d?.kpis
  const loading = dash.isLoading

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Tỷ lệ tuân thủ"
            icon={<CheckCircleOutlined />}
            tone="blue"
            loading={loading}
            value={k?.complianceRate == null ? '—' : `${k.complianceRate.toLocaleString('vi-VN')}`}
            unit={k?.complianceRate == null ? undefined : '%'}
            footnote={`Bình quân ${label} (chuẩn ≥85%)`}
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
            footnote="Hiện tại · chờ xác nhận, khiếu nại, khắc phục, nghiệm thu"
            onClick={() => navigate(`${ROUTES.admin.findings}?status=OPEN`)}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Rủi ro cao"
            icon={<FireOutlined />}
            tone={(k?.highRiskFindings ?? 0) > 0 ? 'critical' : 'neutral'}
            loading={loading}
            value={formatNumber(k?.highRiskFindings ?? 0)}
            unit="lỗi"
            footnote="Hiện tại · mức M3 (7 ngày) & M4 (24 giờ)"
            onClick={() => navigate(`${ROUTES.admin.findings}?status=OPEN`)}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            label="Khắc phục đúng hạn"
            icon={<ClockCircleOutlined />}
            tone="good"
            loading={loading}
            value={k?.onTimeRate == null ? '—' : `${k.onTimeRate.toLocaleString('vi-VN')}`}
            unit={k?.onTimeRate == null ? undefined : '%'}
            footnote={`Lỗi đã đóng trong ${label}`}
            onClick={() => navigate(`${ROUTES.admin.findings}?status=CLOSED`)}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <RestaurantComplianceChart
            data={d?.restaurantCompliance}
            periodLabel={label}
            loading={loading}
            onSelectRestaurant={(r) => navigate(`${ROUTES.admin.inspections}?restaurantId=${r.id}`)}
          />
        </Col>
        <Col xs={24} xl={8}>
          <RiskLevelChart data={d?.openByRiskLevel} levels={levels.data} loading={loading || levels.isLoading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <TrendChart data={d?.trend} loading={loading} />
        </Col>
        <Col xs={24} xl={8}>
          <HorizontalBarChart
            title="Nhà hàng rủi ro cao"
            subtitle="Hiện tại · tổng điểm rủi ro của lỗi đang mở (nhấp để xem lỗi)"
            valueName="Điểm rủi ro"
            loading={loading}
            emptyText="Không có lỗi nào đang mở"
            onRowClick={(row) => row.id && navigate(`${ROUTES.admin.findings}?restaurantId=${row.id}`)}
            rows={(d?.topRestaurants ?? []).map((r) => ({
              id: r.id,
              label: r.name,
              value: r.riskScore,
              hint: `${r.openFindings} lỗi đang mở · ${r.code}`,
            }))}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <HorizontalBarChart
            title="Tiêu chí vi phạm nhiều nhất"
            subtitle={`Số lỗi trong ${label} (không tính lỗi bị bác)`}
            valueName="Số lỗi"
            loading={loading}
            emptyText="Chưa có lỗi nào trong kỳ"
            rows={(d?.topCriteria ?? []).map((c) => ({ label: `${c.key} · ${c.label}`, value: c.count }))}
          />
        </Col>
        <Col xs={24} lg={12}>
          <HorizontalBarChart
            title="Tình trạng xử lý lỗi"
            subtitle={`Lỗi phát sinh trong ${label}, theo bước xử lý`}
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
