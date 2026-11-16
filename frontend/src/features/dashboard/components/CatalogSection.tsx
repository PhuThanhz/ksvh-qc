import { ApartmentOutlined, FileTextOutlined, IdcardOutlined, ShopOutlined, TeamOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Col, Row } from 'antd'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { KpiCard } from '@/components/data-display/KpiCard'
import { ROUTES } from '@/constants/routes'
import { useCriteriaList, useCriterionGroups, useCriterionOptions } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { HorizontalBarChart } from '@/features/dashboard/components/HorizontalBarChart'
import { ImpactChart } from '@/features/dashboard/components/ImpactChart'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { PERMISSIONS, usePermission } from '@/permissions'

type StatProps = { span: number }

function OrgStats({ span }: StatProps) {
  const navigate = useNavigate()
  const restaurants = useOrgUnits({ page: 0, size: 1, unitType: 'RESTAURANT' })
  const departments = useOrgUnits({ page: 0, size: 1, unitType: 'DEPARTMENT' })
  return (
    <>
      <Col xs={12} md={8} xl={span}>
        <KpiCard label="Nhà hàng" footnote="Điểm được kiểm tra" icon={<ShopOutlined />} value={restaurants.data?.totalItems ?? 0} loading={restaurants.isLoading}
          onClick={() => navigate(ROUTES.admin.restaurants)} />
      </Col>
      <Col xs={12} md={8} xl={span}>
        <KpiCard label="Phòng ban" footnote="Đơn vị nội bộ" icon={<ApartmentOutlined />} value={departments.data?.totalItems ?? 0} loading={departments.isLoading}
          onClick={() => navigate(ROUTES.admin.departments)} />
      </Col>
    </>
  )
}

function CriteriaStats({ span }: StatProps) {
  const navigate = useNavigate()
  const criteria = useCriteriaList({ page: 0, size: 1, active: true })
  const templates = useTemplates({ page: 0, size: 1, active: true })
  return (
    <>
      <Col xs={12} md={8} xl={span}>
        <KpiCard label="Tiêu chí" footnote="Đang sử dụng" icon={<UnorderedListOutlined />} value={criteria.data?.totalItems ?? 0}
          loading={criteria.isLoading} onClick={() => navigate(ROUTES.admin.criteria)} />
      </Col>
      <Col xs={12} md={8} xl={span}>
        <KpiCard label="Mẫu phiếu" footnote="Đang sử dụng" icon={<FileTextOutlined />} value={templates.data?.totalItems ?? 0}
          loading={templates.isLoading} onClick={() => navigate(ROUTES.admin.templates)} />
      </Col>
    </>
  )
}

function PeopleStats({ span, showUsers, showEmployees }: StatProps & { showUsers: boolean; showEmployees: boolean }) {
  const navigate = useNavigate()
  return (
    <>
      {showUsers && <UsersKpi span={span} onClick={() => navigate(ROUTES.admin.users)} />}
      {showEmployees && <EmployeesKpi span={span} onClick={() => navigate(ROUTES.admin.employees)} />}
    </>
  )
}

function UsersKpi({ span, onClick }: StatProps & { onClick: () => void }) {
  const users = useUsers({ page: 0, size: 1, active: true })
  return (
    <Col xs={12} md={8} xl={span}>
      <KpiCard label="Tài khoản" footnote="Đang hoạt động" icon={<TeamOutlined />} value={users.data?.totalItems ?? 0} loading={users.isLoading} onClick={onClick} />
    </Col>
  )
}

function EmployeesKpi({ span, onClick }: StatProps & { onClick: () => void }) {
  const employees = useEmployees({ page: 0, size: 1 })
  return (
    <Col xs={12} md={8} xl={span}>
      <KpiCard label="Nhân viên" footnote="Hồ sơ nhân sự" icon={<IdcardOutlined />} value={employees.data?.totalItems ?? 0} loading={employees.isLoading} onClick={onClick} />
    </Col>
  )
}

function CriteriaCharts() {
  const groups = useCriterionGroups()
  const options = useCriterionOptions()
  const rows = useMemo(
    () => (groups.data ?? []).filter((g) => g.active).map((g) => ({ label: g.name, value: g.criterionCount })).sort((a, b) => b.value - a.value).slice(0, 8),
    [groups.data],
  )
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <HorizontalBarChart title="Tiêu chí theo nhóm" subtitle="Các nhóm đang hoạt động, nhiều tiêu chí nhất ở trên" valueName="Số tiêu chí"
          loading={groups.isLoading} emptyText="Chưa có nhóm tiêu chí" rows={rows} />
      </Col>
      <Col xs={24} lg={12}>
        <ImpactChart criteria={options.data} loading={options.isLoading} />
      </Col>
    </Row>
  )
}

/** Phần danh mục: số lượng theo quyền của người xem và cơ cấu bộ tiêu chí. */
export function CatalogSection() {
  const { can } = usePermission()
  const showOrg = can(PERMISSIONS.ORGANIZATION.READ)
  const showCriteria = can(PERMISSIONS.CRITERIA.READ)
  const showUsers = can(PERMISSIONS.USER.READ)
  const showEmployees = can(PERMISSIONS.EMPLOYEE.READ)
  const count = (showOrg ? 2 : 0) + (showCriteria ? 2 : 0) + (showUsers ? 1 : 0) + (showEmployees ? 1 : 0)
  const span = count >= 6 ? 4 : count === 5 ? 4 : 6
  if (count === 0) return null
  return (
    <>
      <Row gutter={[16, 16]}>
        {showOrg && <OrgStats span={span} />}
        {showCriteria && <CriteriaStats span={span} />}
        <PeopleStats span={span} showUsers={showUsers} showEmployees={showEmployees} />
      </Row>
      {showCriteria && <CriteriaCharts />}
    </>
  )
}
