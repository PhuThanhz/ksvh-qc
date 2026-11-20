import { KeyOutlined } from '@ant-design/icons'
import { Badge, Space, Tag, Typography } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'
import { ActionButton, TableActions } from '@/components/data-display/TableActions'
import type { User } from '@/features/users/users.types'
import { PERMISSIONS } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

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
      scroll={{ x: 1380 }}
      columns={[
        {
          title: '#',
          key: 'index',
          width: 56,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', sorter: true, width: 140, render: (u: string) => <span className="code-tag--blue">{u}</span> },
        {
          title: 'Họ và tên',
          dataIndex: 'fullName',
          key: 'fullName',
          sorter: true,
          width: 170,
          render: (name: string, row: User) => (
            <span className="cell-title-link" onClick={() => onEdit(row)}>
              {name ? name.replace(/\s*\(.*?\)/g, '') : ''}
            </span>
          ),
        },
        {
          title: 'Vai trò người dùng',
          dataIndex: 'roles',
          width: 250,
          render: (roles: User['roles']) => (
            <Space size={4} wrap>
              {roles.map((r) => (
                <Tag key={r}>{roleName(r)}</Tag>
              ))}
            </Space>
          ),
        },
        {
          title: 'Trạng thái hoạt động',
          dataIndex: 'active',
          width: 160,
          render: (active: boolean) => <StatusBadge status={active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        },
        {
          title: 'Đăng nhập gần nhất',
          dataIndex: 'lastLoginAt',
          key: 'lastLoginAt',
          sorter: true,
          width: 180,
          render: (_: unknown, u: User) => {
            if (u.online) {
              return (
                <div>
                  <Badge status="processing" color="#10b981" text={<span style={{ fontWeight: 600, color: '#059669' }}>Đang trực tuyến</span>} />
                  {u.lastLoginAt && (
                    <div style={{ fontSize: 11, color: 'var(--app-text-secondary)', marginTop: 2 }}>
                      {formatDateTime(u.lastLoginAt)}
                    </div>
                  )}
                </div>
              )
            }
            if (u.lastLoginAt) {
              return (
                <div>
                  <span style={{ fontSize: 13, color: 'var(--app-text)' }}>{formatDateTime(u.lastLoginAt)}</span>
                  <div style={{ fontSize: 11, color: 'var(--app-text-secondary)', marginTop: 2 }}>Ngoại tuyến</div>
                </div>
              )
            }
            return <Typography.Text type="secondary" style={{ fontSize: 12 }}>Chưa đăng nhập</Typography.Text>
          },
        },
        { title: 'Thời gian khởi tạo', dataIndex: 'createdAt', key: 'createdAt', sorter: true, width: 150, render: formatDateTime },
        {
          title: 'Thao tác',
          key: 'actions',
          width: actionColumnWidth(4),
          // Ghim mép phải bằng CSS sticky (.col-actions), không làm đổi bố cục các cột khác.
      className: 'col-actions',
          align: 'center' as const,
          render: (_: unknown, u: User) => (
            <TableActions
              onView={() => onView(u)}
              onEdit={() => onEdit(u)}
              editAccess={PERMISSIONS.USER.MANAGE}
              onDelete={() => onDelete(u)}
              deleteAccess={PERMISSIONS.USER.MANAGE}
              recordName={u.fullName}
              extra={
                <ActionButton
                  tone="edit"
                  icon={<KeyOutlined />}
                  tooltip="Đặt lại mật khẩu"
                  ariaLabel={`Đặt lại mật khẩu cho ${u.username}`}
                  onClick={() => onResetPassword(u)}
                />
              }
            />
          ),
        },
      ]}
    />
  )
}
