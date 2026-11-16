import { KeyOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'
import { TableActions } from '@/components/data-display/TableActions'
import type { User } from '@/features/users/users.types'
import { PERMISSIONS } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'

type ActiveKey = 'active' | 'inactive'
const ACTIVE_META: Record<ActiveKey, { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  inactive: { label: 'Đã khoá', tone: 'default' },
}

type UserTableProps = Omit<DataTableProps<User>, 'columns' | 'rowKey'> & {
  roleName: (code: string) => string
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onResetPassword: (user: User) => void
}

export function UserTable({ roleName, onView, onEdit, onDelete, onResetPassword, ...props }: UserTableProps) {
  return (
    <DataTable<User>
      {...props}
      rowKey="id"
      columns={[
        {
          title: '#',
          key: 'index',
          width: 60,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', sorter: true },
        { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', sorter: true },
        {
          title: 'Vai trò',
          dataIndex: 'roles',
          render: (roles: User['roles']) => (
            <Space size={4} wrap>
              {roles.map((r) => (
                <Tag key={r}>{roleName(r)}</Tag>
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
        {
          title: 'Thao tác',
          key: 'actions',
          width: 150,
          fixed: 'right',
          render: (_: unknown, u: User) => (
            <TableActions
              onView={() => onView(u)}
              onEdit={() => onEdit(u)}
              editAccess={PERMISSIONS.USER.MANAGE}
              onDelete={() => onDelete(u)}
              deleteAccess={PERMISSIONS.USER.MANAGE}
              recordName={u.fullName}
              extra={
                <Tooltip title="Đặt lại mật khẩu">
                  <Button
                    type="text"
                    icon={<KeyOutlined />}
                    aria-label={`Đặt lại mật khẩu ${u.username}`}
                    onClick={() => onResetPassword(u)}
                  />
                </Tooltip>
              }
            />
          ),
        },
      ]}
    />
  )
}
