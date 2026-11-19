import {
  CalendarOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Col, Row } from 'antd'
import { useNavigate } from 'react-router'
import { KpiCard } from '@/components/data-display/KpiCard'
import { ROUTES } from '@/constants/routes'
import type { EscalationRule, FrequencyConfig } from '@/features/criteria/criteria.types'
import { formatDate } from '@/utils/format-date'

export interface RiskFormulaBannerProps {
  currentFrequency?: FrequencyConfig
  currentEscalation?: EscalationRule
  loading?: boolean
}

/** Bảng chỉ số cấu hình rủi ro đang áp dụng trên toàn hệ thống. */
export function RiskFormulaBanner({
  currentFrequency,
  currentEscalation,
  loading,
}: RiskFormulaBannerProps) {
  const navigate = useNavigate()

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Kỳ đếm tần suất hiện hành"
          value={currentFrequency ? `${currentFrequency.periodMonths}` : '6'}
          unit="tháng"
          icon={<CalendarOutlined />}
          tone="blue"
          loading={loading}
          footnote={
            currentFrequency
              ? `Đang áp dụng từ ${formatDate(currentFrequency.effectiveFrom)}`
              : 'Mặc định hệ thống (6 tháng tính lùi)'
          }
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Ngưỡng nâng mức khi tái phạm"
          value={
            currentEscalation
              ? `Lần ${currentEscalation.thresholdCount} → +${currentEscalation.stepIncrease}`
              : 'Không nâng'
          }
          unit={currentEscalation ? 'bậc' : undefined}
          icon={<RiseOutlined />}
          tone={currentEscalation ? 'warning' : 'neutral'}
          loading={loading}
          footnote={
            currentEscalation
              ? `Trần tối đa: Mức ${currentEscalation.maxImpact} · Từ ${formatDate(currentEscalation.effectiveFrom)}`
              : 'Giữ nguyên mức ảnh hưởng gốc của tiêu chí'
          }
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Chu kỳ hoàn nguyên mức gốc"
          value={currentEscalation ? `${currentEscalation.resetPeriodMonths}` : '—'}
          unit={currentEscalation ? 'tháng sạch lỗi' : undefined}
          icon={<CheckCircleOutlined />}
          tone="good"
          loading={loading}
          footnote="Liên tục không vi phạm lại tiêu chí đó"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Công thức tính điểm rủi ro"
          value="Mức × Tần suất"
          icon={<SafetyCertificateOutlined />}
          tone="neutral"
          footnote="Tra thang M1–M4 tại Phân loại rủi ro →"
          onClick={() => navigate(ROUTES.admin.riskLevels)}
        />
      </Col>
    </Row>
  )
}
