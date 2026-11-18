import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Space, Table, Tag, Typography } from 'antd'
import { useState } from 'react'
import { TableActions } from '@/components/data-display/TableActions'
import { TableCard } from '@/components/data-display/TableCard'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/hooks/useConfirm'
import { useNotify } from '@/hooks/useNotify'
import { PageContainer } from '@/components/layout/PageContainer'
import { RoleDetailModal } from '@/features/roles/components/RoleDetailModal'
import { RoleFormModal } from '@/features/roles/components/RoleFormModal'
import { useDeleteRole, useRoles } from '@/features/roles/hooks/useRoles'
import type { Role } from '@/features/roles/roles.types'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'

export function RoleListPage() {
  const roles = useRoles()
  const remove = useDeleteRole()
  const confirm = useConfirm()
  const notify = useNotify()
  const [editing, setEditing] = useState<{ open: boolean; role?: Role }>({ open: false })
  const [viewing, setViewing] = useState<Role>()

  const onDelete = async (role: Role) => {
    const ok = await confirm({
      title: `Xoá vai trò "${role.name}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(role.id)
      notify.success('Đã xoá vai trò')
    } catch (err: unknown) {
      notify.error(getErrorMessage(err))
    }
  }

  return (
    <PageContainer
      title="Vai trò"
      subtitle="Vai trò = chức danh; mỗi vai trò có một bộ quyền. Một người dùng có thể có nhiều vai trò."
      extra={
        <ProtectedAction access={PERMISSIONS.ROLE.MANAGE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ open: true })}>
            Tạo vai trò
          </Button>
        </ProtectedAction>
      }
    >
      <TableCard>
        {roles.error && !roles.data ? (
          <ErrorState onRetry={() => void roles.refetch()} />
        ) : (
          <Table<Role>
            rowKey="id"
            loading={roles.isFetching}
            dataSource={roles.data}
            pagination={false}
            scroll={{ x: 1050 }}
            columns={[
              {
                title: '#',
                key: 'index',
                width: 56,
                align: 'center',
                render: (_: unknown, __: unknown, index: number) => index + 1,
              },
              {
                title: 'Vai trò',
                dataIndex: 'name',
                width: 200,
                render: (name: string, r) => (
                  <Flex vertical>
                    <Space size={6}>
                      <Typography.Text strong>{name}</Typography.Text>
                      {r.systemRole && <Tag>Gốc</Tag>}
                    </Space>
                    <Typography.Text type="secondary" code>{r.code}</Typography.Text>
                  </Flex>
                ),
              },
              { title: 'Mô tả', dataIndex: 'description', width: 280, render: (d: string | null) => d ?? '—' },
              { title: 'Số quyền', dataIndex: 'permissions', width: 100, align: 'right', render: (p: string[]) => p.length },
              { title: 'Người dùng', dataIndex: 'userCount', width: 110, align: 'right' },
              {
                title: 'Cập nhật',
                key: 'updated',
                width: 170,
                render: (_: unknown, r) => (
                  <Flex vertical>
                    <span>{formatDateTime(r.updatedAt)}</span>
                    {r.updatedByName && <Typography.Text type="secondary">{r.updatedByName}</Typography.Text>}
                  </Flex>
                ),
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 130,
                fixed: 'right',
                render: (_: unknown, r) => (
                  <TableActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing({ open: true, role: r })}
                    editAccess={PERMISSIONS.ROLE.MANAGE}
                    onDelete={!r.systemRole && r.userCount === 0 ? () => onDelete(r) : undefined}
                    deleteAccess={PERMISSIONS.ROLE.MANAGE}
                    deleteDisabledReason={
                      r.systemRole
                        ? 'Không thể xoá vai trò hệ thống'
                        : r.userCount > 0
                          ? 'Đang có người dùng, gỡ vai trò trước khi xoá'
                          : undefined
                    }
                    recordName={r.name}
                  />
                ),
              },
            ]}
          />
        )}
      </TableCard>
      <RoleFormModal open={editing.open} role={editing.role} onClose={() => setEditing({ open: false })} />
      <RoleDetailModal open={Boolean(viewing)} role={viewing} onClose={() => setViewing(undefined)} />
    </PageContainer>
  )
}
