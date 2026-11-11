import { Space, Tag } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'
import type { User } from '@/features/users/users.types'
import { roleLabel } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'

type ActiveKey = 'active' | 'inactive'
const ACTIVE_META: Record<ActiveKey, { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  inactive: { label: 'Đã khoá', tone: 'default' },
}

type UserTableProps = Omit<DataTableProps<User>, 'columns' | 'rowKey'>

export function UserTable(props: UserTableProps) {
  return (
    <DataTable<User>
      {...props}
      rowKey="id"
      columns={[
        { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', sorter: true },
        { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', sorter: true },
        {
          title: 'Vai trò',
          dataIndex: 'roles',
          render: (roles: User['roles']) => (
            <Space size={4} wrap>
              {roles.map((r) => (
                <Tag key={r}>{roleLabel(r)}</Tag>
              ))}
            </Space>
          ),
        },
        {
          title: 'Trạng thái',
          dataIndex: 'active',
          render: (active: boolean) => <StatusBadge status={active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: formatDateTime },
      ]}
    />
  )
}
