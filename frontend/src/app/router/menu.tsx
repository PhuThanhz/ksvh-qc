import { AppstoreOutlined, DashboardOutlined, EnvironmentOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { MenuEntry } from '@/components/layout/menu.types'
import type { AppRoute, MenuIconKey } from '@/types/route.types'

const MENU_ICONS: Record<MenuIconKey, ReactNode> = {
  dashboard: <DashboardOutlined />,
  users: <TeamOutlined />,
  audits: <AppstoreOutlined />,
  checkin: <EnvironmentOutlined />,
  home: <HomeOutlined />,
}

/** Sinh menu từ route có handle.menu. Thêm trang vào menu = khai báo handle.menu ở file routes của feature. */
export function buildMenu(routes: readonly AppRoute[]): MenuEntry[] {
  return routes.flatMap((r) => {
    const menu = r.handle?.menu
    if (!menu || !r.path) return []
    return [{ path: r.path, label: menu.label, icon: MENU_ICONS[menu.icon], access: r.handle?.access }]
  })
}
