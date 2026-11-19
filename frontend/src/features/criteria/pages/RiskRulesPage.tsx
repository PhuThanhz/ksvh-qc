import { Col, Flex, Row } from 'antd'
import { PageContainer } from '@/components/layout/PageContainer'
import { EscalationCard } from '@/features/criteria/components/EscalationCard'
import { FrequencyCard } from '@/features/criteria/components/FrequencyCard'
import { RiskFormulaBanner } from '@/features/criteria/components/RiskFormulaBanner'

/** Danh mục 8–9: kỳ đếm tần suất và quy tắc nâng / hạ mức (phiên bản theo ngày áp dụng). */
export function RiskRulesPage() {
  return (
    <PageContainer
      title="Quy tắc tái phạm & Nâng mức rủi ro"
      subtitle="Hai thông số quyết định tần suất và mức ảnh hưởng khi một nhà hàng mắc lại cùng một lỗi"
    >
      <Flex vertical gap={16}>
        <RiskFormulaBanner />
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} lg={12}>
            <FrequencyCard />
          </Col>
          <Col xs={24} lg={12}>
            <EscalationCard />
          </Col>
        </Row>
      </Flex>
    </PageContainer>
  )
}
