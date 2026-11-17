import { SettingOutlined } from '@ant-design/icons'
import { ConfigProvider, Menu, type MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import type { MenuEntry } from '@/components/layout/menu.types'
import { usePermission } from '@/permissions'

export interface SidebarProps {
  menu: readonly MenuEntry[]
  onSelect?: () => void
}

type MenuItem = NonNullable<MenuProps['items']>[number]

const groupKey = (label: string) => `group:${label}`

/** Theme token độc quyền cho Menu trên nền kính mờ Apple Frosted Glass */
const sidebarMenuTheme = {
  components: {
    Menu: {
      itemColor: '#334155',
      itemHoverColor: '#0f172a',
      itemHoverBg: 'rgba(0, 0, 0, 0.05)',
      itemSelectedColor: '#ffffff',
      itemSelectedBg: '#0071e3',
      subMenuItemBg: 'transparent',
      itemBg: 'transparent',
      fontSize: 13.5,
      iconSize: 16,
      itemHeight: 36,
      itemMarginBlock: 3,
      itemMarginInline: 6,
      itemBorderRadius: 8,
      groupTitleColor: '#64748b',
    },
  },
}

/**
 * Menu sinh từ cấu hình, tự lọc theo quyền. Mục có `group` được gom thành menu con (mở sẵn),
 * nhóm không còn mục nào đủ quyền thì ẩn. Mục đang chọn = mục có path dài nhất khớp URL.
 */
export function Sidebar({ menu, onSelect }: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allows } = usePermission()

  const visible = menu.filter((m) => allows(m.access))
  const selected = visible
    .filter((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path

  const items: MenuItem[] = []
  const groups = new Map<string, MenuItem[]>()
  for (const m of visible) {
    const item: MenuItem = { key: m.path, icon: m.icon, label: m.label }
    if (!m.group) {
      items.push(item)
      continue
    }
    let children = groups.get(m.group)
    if (!children) {
      children = []
      groups.set(m.group, children)
      items.push({ key: groupKey(m.group), icon: m.groupIcon ?? <SettingOutlined />, label: m.group, children })
    }
    children.push(item)
  }

  return (
    <ConfigProvider theme={sidebarMenuTheme}>
      <Menu
        mode="inline"
        selectedKeys={selected ? [selected] : []}
        defaultOpenKeys={[...groups.keys()].map(groupKey)}
        items={items}
        onClick={(e) => {
          navigate(e.key)
          onSelect?.()
        }}
        style={{ borderInlineEnd: 'none', paddingInline: 4, paddingTop: 6, background: 'transparent' }}
      />
    </ConfigProvider>
  )
}
