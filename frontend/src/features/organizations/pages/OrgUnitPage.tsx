import { ApartmentOutlined, ShopOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { OrganizationExcelActions } from '@/features/organizations/components/OrganizationExcelActions'
import { OrgUnitTab } from '@/features/organizations/components/OrgUnitTab'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import type { OrgUnitType } from '@/features/organizations/organizations.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

/** Tab trên URL (?tab=restaurants | departments) để giữ khi tải lại trang và để link thẳng vào từng tab. */
const ORG_UNIT_TAB_PARAM = 'tab'
const TABS: { key: string; type: OrgUnitType; label: string; addLabel: string; icon: React.ReactNode }[] = [
  { key: 'restaurants', type: 'RESTAURANT', label: 'Nhà hàng', addLabel: 'Thêm nhà hàng', icon: <ShopOutlined /> },
  { key: 'departments', type: 'DEPARTMENT', label: 'Phòng ban', addLabel: 'Thêm phòng ban', icon: <ApartmentOutlined /> },
]

/** Danh mục 2: nhà hàng và phòng ban, tách 2 tab nằm giữa bộ lọc và bảng. */
export function OrgUnitPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const active = TABS.find((t) => t.key === searchParams.get(ORG_UNIT_TAB_PARAM)) ?? TABS[0]!
  const restaurantCount = useOrgUnits({ page: 0, size: 1, unitType: 'RESTAURANT' }).data?.totalItems
  const departmentCount = useOrgUnits({ page: 0, size: 1, unitType: 'DEPARTMENT' }).data?.totalItems
  const counts: Record<OrgUnitType, number | undefined> = { RESTAURANT: restaurantCount, DEPARTMENT: departmentCount }

  return (
    <PageContainer
      title="Đơn vị & Cơ sở vận hành"
      subtitle="Nhà hàng (được kiểm tra) và phòng ban nghiệp vụ trực thuộc các công ty"
      headerExtra={<OrganizationExcelActions />}
      extra={
        <ProtectedAction access={PERMISSIONS.ORGANIZATION.MANAGE}>
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Thêm đơn vị & cơ sở
          </Button>
        </ProtectedAction>
      }
    >
      <OrgUnitTab
        key={active.key}
        fixedUnitType={active.type}
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
        tabs={
          <ViewTabs
            items={TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon, count: counts[t.type] }))}
            activeKey={active.key}
            onChange={(key) => {
              setCreateOpen(false)
              setSearchParams({ [ORG_UNIT_TAB_PARAM]: key }, { replace: true })
            }}
          />
        }
      />
    </PageContainer>
  )
}
