import { PageContainer } from '@/components/layout/PageContainer'
import { CompanyTab } from '@/features/organizations/components/CompanyTab'

/** Danh mục công ty pháp nhân (docs/DOMAIN_SPEC.md §3). */
export function CompanyPage() {
  return (
    <PageContainer
      title="Công ty"
      subtitle="Danh mục công ty pháp nhân trong hệ thống"
    >
      <CompanyTab />
    </PageContainer>
  )
}

