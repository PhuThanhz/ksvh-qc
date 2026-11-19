import { Flex } from 'antd'
import { PageContainer } from '@/components/layout/PageContainer'
import { EscalationCard } from '@/features/criteria/components/EscalationCard'
import { FrequencyCard } from '@/features/criteria/components/FrequencyCard'

/** Danh mục 8–9: cấu hình tần suất và quy tắc nâng mức ảnh hưởng (phiên bản theo ngày hiệu lực). */
export function RiskRulesPage() {
  return (
    <PageContainer
      title="Quy tắc tái phạm & Nâng mức rủi ro"
      subtitle="Cấu hình chu kỳ xác định tái diễn vi phạm và quy tắc tự động nâng mức độ ảnh hưởng theo tần suất"
    >
      <Flex vertical gap={16}>
        <FrequencyCard />
        <EscalationCard />
      </Flex>
    </PageContainer>
  )
}
