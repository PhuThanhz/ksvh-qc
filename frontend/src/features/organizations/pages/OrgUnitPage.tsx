import { PageContainer } from '@/components/layout/PageContainer'
import { OrgUnitTab } from '@/features/organizations/components/OrgUnitTab'

export function OrgUnitPage() {
  return (
    <PageContainer
      title="Đơn vị trực thuộc"
      subtitle="Quản lý toàn bộ danh sách nhà hàng và phòng ban trực thuộc các công ty"
    >
      <OrgUnitTab />
    </PageContainer>
  )
}

