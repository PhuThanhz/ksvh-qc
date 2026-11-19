import { AppstoreOutlined, BarcodeOutlined, EditOutlined, KeyOutlined, SafetyOutlined } from '@ant-design/icons'
import { Button, Space, Tag } from 'antd'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import { moduleLabel, type PermissionInfo, type Role } from '@/features/roles/roles.types'

export interface PermissionDetailModalProps {
  open: boolean
  permission?: PermissionInfo
  roles: readonly Role[]
  canEdit?: boolean
  onClose: () => void
  onEdit?: (permission: PermissionInfo) => void
}

export function PermissionDetailModal({
  open,
  permission,
  roles,
  canEdit,
  onClose,
  onEdit,
}: PermissionDetailModalProps) {
  if (!permission) return null

  const grantedRoles = roles.filter((r) => r.permissions.includes(permission.code))
  const ungrantedRoles = roles.filter((r) => !r.permissions.includes(permission.code))

  const fields: DetailField[] = [
    { label: 'Mã quyền hệ thống', value: <span className="code-tag--blue">{permission.code}</span> },
    { label: 'Nhóm chức năng (Module)', value: <Tag>{moduleLabel(permission.module)}</Tag> },
    { label: 'Tên / Mô tả quyền hạn', span: 2, value: permission.description },
    {
      label: `Vai trò được cấp (${grantedRoles.length} / ${roles.length})`,
      span: 2,
      value:
        grantedRoles.length > 0 ? (
          <Space size={6} wrap>
            {grantedRoles.map((r) => (
              <Tag key={r.id} color="success">
                {r.name} ({r.code})
              </Tag>
            ))}
          </Space>
        ) : (
          'Chưa có vai trò nào được cấp quyền này'
        ),
    },
    {
      label: `Vai trò chưa được cấp (${ungrantedRoles.length})`,
      span: 2,
      value:
        ungrantedRoles.length > 0 ? (
          <Space size={6} wrap>
            {ungrantedRoles.map((r) => (
              <Tag key={r.id}>{r.name}</Tag>
            ))}
          </Space>
        ) : (
          'Tất cả vai trò đã được cấp quyền này'
        ),
    },
  ]

  return (
    <DetailModal
      open={open}
      title="Chi tiết quyền chức năng"
      icon={<KeyOutlined />}
      hero={{
        avatar: <KeyOutlined />,
        eyebrow: moduleLabel(permission.module),
        title: permission.description,
        chips: [
          { icon: <BarcodeOutlined />, label: permission.code },
          { icon: <AppstoreOutlined />, label: moduleLabel(permission.module) },
          { icon: <SafetyOutlined />, label: `${grantedRoles.length}/${roles.length} vai trò được cấp` },
        ],
      }}
      fields={fields}
      onClose={onClose}
      extraFooter={
        canEdit &&
        onEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              onClose()
              onEdit(permission)
            }}
          >
            Sửa phân quyền
          </Button>
        )
      }
    />
  )
}
