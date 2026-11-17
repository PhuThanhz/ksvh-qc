import { Flex } from 'antd'
import { PageContainer } from '@/components/layout/PageContainer'
import { EscalationCard } from '@/features/criteria/components/EscalationCard'
import { FrequencyCard } from '@/features/criteria/components/FrequencyCard'

/** Danh mục 8–9: cấu hình tần suất và quy tắc nâng mức ảnh hưởng (phiên bản theo ngày hiệu lực). */
export function RiskRulesPage() {
  return (
    <PageContainer
      title="Tần suất & nâng mức"
      subtitle="Mỗi thay đổi là một phiên bản mới có ngày hiệu lực; phiên bản đã áp dụng không sửa được"
    >
      <Flex vertical gap={16}>
        <FrequencyCard />
        <EscalationCard />
      </Flex>
    </PageContainer>
  )
}
