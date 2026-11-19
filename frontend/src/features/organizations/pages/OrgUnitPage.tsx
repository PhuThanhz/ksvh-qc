import { PlusOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { OrganizationExcelActions } from '@/features/organizations/components/OrganizationExcelActions'
import { OrgUnitTab } from '@/features/organizations/components/OrgUnitTab'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function OrgUnitPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <PageContainer
      title="Đơn vị & Cơ sở vận hành"
      subtitle="Quản lý toàn bộ danh mục nhà hàng, chi nhánh cơ sở và phòng ban nghiệp vụ trực thuộc"
      extra={
        <Space size={8} wrap>
          <OrganizationExcelActions />
          <ProtectedAction access={PERMISSIONS.ORGANIZATION.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Thêm cơ sở / đơn vị
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <OrgUnitTab createOpen={createOpen} onCreateClose={() => setCreateOpen(false)} />
    </PageContainer>
  )
}

