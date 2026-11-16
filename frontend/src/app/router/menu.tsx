import {
  ApartmentOutlined,
  BankOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  WarningOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  IdcardOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  AuditOutlined,
  CalendarOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { MenuEntry } from '@/components/layout/menu.types'
import type { AppRoute, MenuGroupKey, MenuIconKey } from '@/types/route.types'

const MENU_ICONS: Record<MenuIconKey, ReactNode> = {
  dashboard: <DashboardOutlined />,
  users: <TeamOutlined />,
  organizations: <ApartmentOutlined />,
  restaurants: <ShopOutlined />,
  departments: <ApartmentOutlined />,
  companies: <BankOutlined />,
  permissions: <KeyOutlined />,
  roles: <SafetyCertificateOutlined />,
  employees: <IdcardOutlined />,
  system: <AppstoreOutlined />,
  criteriaGroups: <AppstoreOutlined />,
  criteria: <UnorderedListOutlined />,
  templates: <FileTextOutlined />,
  riskLevels: <WarningOutlined />,
  riskRules: <FieldTimeOutlined />,
  plans: <CalendarOutlined />,
  inspections: <AuditOutlined />,
  findings: <AlertOutlined />,
  checkin: <EnvironmentOutlined />,
  home: <HomeOutlined />,
}

/** Nhãn hiển thị của nhóm menu (Sidebar gom các mục cùng nhóm thành menu con). */
export const MENU_GROUPS: Record<MenuGroupKey, { label: string; icon: ReactNode }> = {
  operations: { label: 'Vận hành kiểm soát', icon: <AuditOutlined /> },
  catalog: { label: 'Danh mục thiết lập', icon: <DatabaseOutlined /> },
  system: { label: 'Quản trị hệ thống', icon: <SettingOutlined /> },
}

/** Sinh menu từ route có handle.menu. Thêm trang vào menu = khai báo handle.menu ở file routes của feature. */
export function buildMenu(routes: readonly AppRoute[]): MenuEntry[] {
  return routes.flatMap((r) => {
    const menu = r.handle?.menu
    if (!menu || !r.path) return []
    return [
      {
        path: r.path,
        label: menu.label,
        icon: MENU_ICONS[menu.icon],
        access: r.handle?.access,
        group: menu.group ? MENU_GROUPS[menu.group].label : undefined,
        groupIcon: menu.group ? MENU_GROUPS[menu.group].icon : undefined,
      },
    ]
  })
}
