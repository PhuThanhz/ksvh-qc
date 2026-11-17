import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS, usePermission } from '@/permissions'
import type { Permission } from '@/permissions/permissions'

const ITEMS: { key: string; label: string; route: string; access: Permission }[] = [
  { key: 'inspection', label: 'Phiếu chấm KSVH', route: ROUTES.admin.inspections, access: PERMISSIONS.PLAN.CREATE },
  { key: 'plan', label: 'Kế hoạch kiểm tra', route: ROUTES.admin.plans, access: PERMISSIONS.PLAN.CREATE },
  { key: 'restaurant', label: 'Nhà hàng', route: ROUTES.admin.restaurants, access: PERMISSIONS.ORGANIZATION.MANAGE },
  { key: 'criterion', label: 'Tiêu chí', route: ROUTES.admin.criteria, access: PERMISSIONS.CRITERIA.MANAGE },
  { key: 'template', label: 'Mẫu phiếu chấm', route: ROUTES.admin.templates, access: PERMISSIONS.CRITERIA.MANAGE },
  { key: 'user', label: 'Tài khoản người dùng', route: ROUTES.admin.users, access: PERMISSIONS.USER.MANAGE },
  { key: 'employee', label: 'Nhân viên', route: ROUTES.admin.employees, access: PERMISSIONS.EMPLOYEE.MANAGE },
]

/** Nút "Tạo mới" ở đầu trang: chỉ liệt kê mục người dùng có quyền tạo. */
export function CreateMenu() {
  const navigate = useNavigate()
  const { can } = usePermission()
  const items: MenuProps['items'] = ITEMS.filter((i) => can(i.access)).map((i) => ({ key: i.key, label: i.label }))
  if (!items.length) return null
  return (
    <Dropdown
      trigger={['click']}
      menu={{ items, onClick: ({ key }) => {
        const target = ITEMS.find((i) => i.key === key)
        if (target) navigate(target.route)
      } }}
    >
      <Button type="primary" icon={<PlusOutlined />}>
        Tạo mới <DownOutlined style={{ fontSize: 10 }} />
      </Button>
    </Dropdown>
  )
}
