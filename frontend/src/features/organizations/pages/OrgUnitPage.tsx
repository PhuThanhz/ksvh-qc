import { ApartmentOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons'
import { Badge, Button, Space, Tabs } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
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

function TabLabel({ type, label, icon }: { type: OrgUnitType; label: string; icon: React.ReactNode }) {
  const count = useOrgUnits({ page: 0, size: 1, unitType: type })
  return (
    <Space size={6}>
      {icon}
      {label}
      <Badge count={count.data?.totalItems ?? 0} showZero overflowCount={9999} color="#e8e8ed" style={{ color: '#3a3936', fontWeight: 600 }} />
    </Space>
  )
}

/** Danh mục 2: nhà hàng và phòng ban, tách 2 tab ngay trên bảng. */
export function OrgUnitPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const active = TABS.find((t) => t.key === searchParams.get(ORG_UNIT_TAB_PARAM)) ?? TABS[0]!

  return (
    <PageContainer
      title="Đơn vị & Cơ sở vận hành"
      subtitle="Nhà hàng (được kiểm tra) và phòng ban nghiệp vụ trực thuộc các công ty"
      extra={
        <Space size={8} wrap>
          <OrganizationExcelActions />
          <ProtectedAction access={PERMISSIONS.ORGANIZATION.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {active.addLabel}
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <Tabs
        activeKey={active.key}
        onChange={(key) => {
          setCreateOpen(false)
          setSearchParams({ [ORG_UNIT_TAB_PARAM]: key }, { replace: true })
        }}
        destroyOnHidden
        items={TABS.map((t) => ({
          key: t.key,
          label: <TabLabel type={t.type} label={t.label} icon={t.icon} />,
          children: (
            <OrgUnitTab
              key={t.key}
              fixedUnitType={t.type}
              createOpen={createOpen && active.key === t.key}
              onCreateClose={() => setCreateOpen(false)}
            />
          ),
        }))}
      />
    </PageContainer>
  )
}
