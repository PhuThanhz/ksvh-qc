import { EditOutlined, IdcardOutlined, KeyOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Button, Space, Tag } from 'antd'
import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import type { User } from '@/features/users/users.types'
import { formatDateTime } from '@/utils/format-date'

const ACTIVE_META: Record<'active' | 'inactive', { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  inactive: { label: 'Đã khoá', tone: 'default' },
}

export interface UserDetailModalProps {
  open: boolean
  user?: User
  roleName: (code: string) => string
  onClose: () => void
  onEdit?: (user: User) => void
  onResetPassword?: (user: User) => void
}

export function UserDetailModal({ open, user, roleName, onClose, onEdit, onResetPassword }: UserDetailModalProps) {
  if (!user) return null

  const fields: DetailField[] = [
    { label: 'Tên đăng nhập', value: user.username },
    { label: 'Họ và tên', value: user.fullName },
    {
      label: 'Vai trò',
      span: 2,
      value: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {user.roles.map((r) => (
            <Tag key={r}>{roleName(r)}</Tag>
          ))}
        </div>
      ),
    },
    {
      label: 'Trạng thái',
      value: <StatusBadge status={user.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
    },
    {
      label: 'Đăng nhập gần nhất',
      value: user.lastLoginAt ? (
        <Space size={8}>
          <Badge status={user.online ? 'processing' : 'default'} color={user.online ? '#10b981' : undefined} text={user.online ? 'Đang trực tuyến' : 'Ngoại tuyến'} />
          <span style={{ color: 'var(--app-text-secondary)', fontSize: 13 }}>({formatDateTime(user.lastLoginAt)})</span>
        </Space>
      ) : (
        <span style={{ color: 'var(--app-text-secondary)', fontSize: 13 }}>Chưa từng đăng nhập</span>
      ),
    },
  ]

  const extraFooter = (
    <Space key="actions">
      {onResetPassword && (
        <Button
          icon={<KeyOutlined />}
          onClick={() => {
            onClose()
            onResetPassword(user)
          }}
        >
          Đặt lại mật khẩu
        </Button>
      )}
      {onEdit && (
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            onClose()
            onEdit(user)
          }}
        >
          Chỉnh sửa
        </Button>
      )}
    </Space>
  )

  return (
    <DetailModal
      open={open}
      title="Chi tiết người dùng"
      subtitle="Tài khoản đăng nhập & vai trò trong hệ thống"
      icon={<UserOutlined />}
      hero={{
        avatar: user.fullName.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase() ?? <UserOutlined />,
        eyebrow: 'Hồ sơ người dùng',
        title: user.fullName,
        status: <StatusBadge status={user.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        chips: [
          { icon: <IdcardOutlined />, label: user.username },
          ...user.roles.map((r) => ({ icon: <SafetyOutlined />, label: roleName(r) })),
        ],
      }}
      audit={{ createdAt: formatDateTime(user.createdAt) }}
      width={600}
      fields={fields}
      extraFooter={extraFooter}
      onClose={onClose}
    />
  )
}

