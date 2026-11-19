import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { CompanyTab } from '@/features/organizations/components/CompanyTab'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

/** Danh mục công ty pháp nhân (docs/DOMAIN_SPEC.md §3). */
export function CompanyPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <PageContainer
      title="Công ty thành viên"
      subtitle="Danh mục các công ty pháp nhân và thương hiệu trực thuộc hệ thống"
      extra={
        <ProtectedAction access={PERMISSIONS.ORGANIZATION.MANAGE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Thêm công ty thành viên
          </Button>
        </ProtectedAction>
      }
    >
      <CompanyTab createOpen={createOpen} onCreateClose={() => setCreateOpen(false)} />
    </PageContainer>
  )
}

