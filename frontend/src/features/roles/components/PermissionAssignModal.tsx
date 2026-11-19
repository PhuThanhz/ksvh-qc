import { LockOutlined } from '@ant-design/icons'
import { Checkbox, Flex, Modal, Space, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNotify } from '@/components/feedback/useNotify'
import { rolesApi } from '@/features/roles/api/roles.api'
import { roleKeys } from '@/features/roles/api/roles.keys'
import { lockReason } from '@/features/roles/hooks/useTogglePermission'
import { moduleLabel, type PermissionInfo, type Role } from '@/features/roles/roles.types'
import { getErrorMessage } from '@/lib/http'
import { useQueryClient } from '@tanstack/react-query'

export interface PermissionAssignModalProps {
  open: boolean
  permission?: PermissionInfo
  roles: readonly Role[]
  onClose: () => void
}

/** Modal sửa các vai trò được cấp một quyền cụ thể. */
export function PermissionAssignModal({
  open,
  permission,
  roles,
  onClose,
}: PermissionAssignModalProps) {
  const notify = useNotify()
  const qc = useQueryClient()
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !permission) return
    const initial = roles.filter((r) => r.permissions.includes(permission.code)).map((r) => r.id)
    setSelectedRoleIds(initial)
  }, [open, permission, roles])

  if (!permission) return null

  const toggleRole = (roleId: number, checked: boolean) => {
    setSelectedRoleIds((prev) =>
      checked ? [...new Set([...prev, roleId])] : prev.filter((id) => id !== roleId),
    )
  }

  const handleSave = async () => {
    const selectedSet = new Set(selectedRoleIds)
    const changedRoles = roles.filter((r) => {
      const hasPerm = r.permissions.includes(permission.code)
      const shouldHavePerm = selectedSet.has(r.id)
      return hasPerm !== shouldHavePerm && !lockReason(r, permission)
    })

    if (changedRoles.length === 0) {
      onClose()
      return
    }

    setSaving(true)
    try {
      await Promise.all(
        changedRoles.map((r) => {
          const shouldHavePerm = selectedSet.has(r.id)
          const nextPermissions = shouldHavePerm
            ? [...new Set([...r.permissions, permission.code])]
            : r.permissions.filter((c) => c !== permission.code)

          return rolesApi.update(r.id, {
            code: r.code,
            name: r.name,
            description: r.description ?? undefined,
            permissions: nextPermissions,
          })
        }),
      )
      await qc.invalidateQueries({ queryKey: roleKeys.all })
      notify.success(`Đã cập nhật phân quyền "${permission.description}"`)
      onClose()
    } catch (err) {
      notify.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={`Sửa phân quyền: ${permission.description}`}
      okText="Lưu phân quyền"
      cancelText="Huỷ"
      width={620}
      centered
      confirmLoading={saving}
      onOk={() => void handleSave()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Flex vertical gap={14} style={{ paddingBottom: 12 }}>
        <Flex align="center" gap={8} wrap>
          <span className="code-tag--blue">{permission.code}</span>
          <Tag>{moduleLabel(permission.module)}</Tag>
        </Flex>

        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Chọn các vai trò được phép thực hiện quyền hạn này:
        </Typography.Text>

        <Flex vertical gap={8}>
          {roles.map((role) => {
            const locked = lockReason(role, permission)
            const checked = selectedRoleIds.includes(role.id)
            return (
              <div
                key={role.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
                  background: checked ? '#f8fafc' : '#ffffff',
                }}
              >
                <Checkbox
                  checked={checked}
                  disabled={Boolean(locked)}
                  onChange={(e) => toggleRole(role.id, e.target.checked)}
                  style={{ width: '100%' }}
                >
                  <Space size={8} wrap>
                    <Typography.Text strong>{role.name}</Typography.Text>
                    <Typography.Text type="secondary" code>
                      {role.code}
                    </Typography.Text>
                    {role.systemRole && <Tag style={{ margin: 0 }}>Gốc</Tag>}
                    {locked && (
                      <Tooltip title={locked}>
                        <Tag color="warning" icon={<LockOutlined />} style={{ margin: 0 }}>
                          Bắt buộc
                        </Tag>
                      </Tooltip>
                    )}
                  </Space>
                  {role.description && (
                    <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
                      {role.description}
                    </div>
                  )}
                </Checkbox>
              </div>
            )
          })}
        </Flex>
      </Flex>
    </Modal>
  )
}
