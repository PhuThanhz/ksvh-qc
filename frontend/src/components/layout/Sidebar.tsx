import { Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'
import { usePermission } from '@/permissions'

export interface SidebarProps {
  menu: readonly MenuEntry[]
  onSelect?: () => void
}

/** Menu sinh từ cấu hình, tự lọc theo quyền. Mục đang chọn = mục có path dài nhất khớp URL. */
export function Sidebar({ menu, onSelect }: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allows } = usePermission()

  const visible = menu.filter((m) => allows(m.access))
  const selected = visible
    .filter((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path

  return (
    <Menu
      mode="inline"
      selectedKeys={selected ? [selected] : []}
      items={visible.map((m) => ({ key: m.path, icon: m.icon, label: m.label }))}
      onClick={(e) => {
        navigate(e.key)
        onSelect?.()
      }}
      style={{ borderInlineEnd: 'none', paddingInline: 8, paddingTop: 8 }}
    />
  )
}
