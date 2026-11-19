import { Tabs } from 'antd'
import { PageContainer } from '@/components/layout/PageContainer'
import { CompanyTab } from '@/features/organizations/components/CompanyTab'
import { OrgUnitTab } from '@/features/organizations/components/OrgUnitTab'
import { OrganizationExcelActions } from '@/features/organizations/components/OrganizationExcelActions'

/** Danh mục 1–2: công ty, nhà hàng và phòng ban (docs/DOMAIN_SPEC.md §3). */
export function OrganizationPage() {
  return (
    <PageContainer
      title="Đơn vị & Cơ sở vận hành"
      subtitle="Quản lý danh mục nhà hàng, phòng ban và các công ty thành viên"
      extra={<OrganizationExcelActions />}
    >
      <Tabs
        defaultActiveKey="restaurants"
        destroyOnHidden
        items={[
          {
            key: 'restaurants',
            label: 'Nhà hàng / Cơ sở',
            children: <OrgUnitTab fixedUnitType="RESTAURANT" />,
          },
          {
            key: 'departments',
            label: 'Phòng ban',
            children: <OrgUnitTab fixedUnitType="DEPARTMENT" />,
          },
          {
            key: 'companies',
            label: 'Công ty thành viên',
            children: <CompanyTab />,
          },
        ]}
      />
    </PageContainer>
  )
}
