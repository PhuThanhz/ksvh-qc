import { Space, Tag } from 'antd'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import type { Role } from '@/features/roles/roles.types'
import { formatDateTime } from '@/utils/format-date'

export interface RoleDetailModalProps {
  open: boolean
  role?: Role
  onClose: () => void
}

export function RoleDetailModal({ open, role, onClose }: RoleDetailModalProps) {
  if (!role) return null

  const fields: DetailField[] = [
    { label: 'Mã vai trò', value: <code>{role.code}</code> },
    {
      label: 'Tên vai trò',
      value: (
        <Space size={6}>
          <span>{role.name}</span>
          {role.systemRole && <Tag>Gốc</Tag>}
        </Space>
      ),
    },
    { label: 'Số người dùng', value: `${role.userCount} người dùng` },
    { label: 'Mô tả', span: 2, value: role.description || '—' },
    {
      label: `Danh sách quyền (${role.permissions?.length ?? 0})`,
      span: 2,
      value: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {(role.permissions ?? []).map((p) => (
            <Tag key={p}>{p}</Tag>
          ))}
        </div>
      ),
    },
    { label: 'Cập nhật lần cuối', value: formatDateTime(role.updatedAt) },
    { label: 'Người cập nhật', value: role.updatedByName || '—' },
  ]

  return (
    <DetailModal
      open={open}
      title={`Chi tiết vai trò: ${role.name}`}
      width={640}
      fields={fields}
      onClose={onClose}
    />
  )
}

