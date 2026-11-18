import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Space } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { AdvancedFilter, type FilterTagItem } from '@/components/data-entry/AdvancedFilter'
import { FilterSelect } from '@/components/data-entry/FilterSelect'
import { ActiveFilter } from '@/components/data-entry/ActiveFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRoles } from '@/features/roles'
import { ResetPasswordModal } from '@/features/users/components/ResetPasswordModal'
import { UserCreateModal } from '@/features/users/components/UserCreateModal'
import { UserDetailModal } from '@/features/users/components/UserDetailModal'
import { UserEditModal } from '@/features/users/components/UserEditModal'
import { UserTable } from '@/features/users/components/UserTable'
import { useDeleteUser } from '@/features/users/hooks/useUserMutations'
import { useUsers } from '@/features/users/hooks/useUsers'
import type { User } from '@/features/users/users.types'
import { useConfirm } from '@/hooks/useConfirm'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction, roleLabel } from '@/permissions'
import { UserExcelActions } from '@/features/users/components/UserExcelActions'

interface UserFilters extends Record<string, unknown> {
  keyword?: string
  role?: string
  active?: boolean
}

export function UserListPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<UserFilters>()
  const users = useUsers(params)
  const roles = useRoles()
  const remove = useDeleteUser()
  const confirm = useConfirm()
  const notify = useNotify()

  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<User>()
  const [editing, setEditing] = useState<User>()
  const [resetting, setResetting] = useState<User>()

  const onSearch = useCallback((keyword: string) => setFilter('keyword', keyword || undefined), [setFilter])

  const roleNames = useMemo(() => new Map((roles.data ?? []).map((r) => [r.code, r.name])), [roles.data])
  const roleName = useCallback((code: string) => roleNames.get(code) ?? roleLabel(code), [roleNames])

  const onDelete = useCallback(
    async (user: User) => {
      const ok = await confirm({
        title: 'Xoá người dùng',
        content: `Bạn có chắc chắn muốn xoá người dùng "${user.fullName}" (${user.username})? Hành động này không thể hoàn tác.`,
        okText: 'Xoá',
        danger: true,
      })
      if (!ok) return
      try {
        await remove.mutateAsync(user.id)
        notify.success(`Đã xoá người dùng ${user.fullName}`)
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? 'Không thể xoá người dùng'
        notify.error(msg)
      }
    },
    [confirm, notify, remove],
  )


  const activeTags = useMemo<FilterTagItem[]>(() => {
    const tags: FilterTagItem[] = []
    if (filters.keyword) {
      tags.push({ key: 'keyword', label: `Từ khoá: ${filters.keyword}`, onClose: () => setFilter('keyword', undefined) })
    }
    if (filters.role) {
      tags.push({ key: 'role', label: `Vai trò: ${roleName(filters.role)}`, onClose: () => setFilter('role', undefined) })
    }
    if (filters.active !== undefined) {
      tags.push({
        key: 'active',
        label: filters.active ? 'Đang hoạt động' : 'Đã khoá',
        onClose: () => setFilter('active', undefined),
      })
    }
    return tags
  }, [filters, roleName, setFilter])

  return (
    <PageContainer
      title="Người dùng"
      subtitle="Tài khoản đăng nhập và vai trò"
      extra={
        <Space size={8}>
          <UserExcelActions />
          <ProtectedAction access={PERMISSIONS.USER.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
              Tạo người dùng
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <Flex vertical gap={16}>
        <AdvancedFilter
          search={{ value: filters.keyword ?? '', placeholder: 'Tìm theo tên đăng nhập hoặc họ tên', onSearch }}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          activeTags={activeTags}
        >
          <FilterSelect<string>
            placeholder="Vai trò"
            width={200}
            value={filters.role}
            options={(roles.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
            onChange={(v) => setFilter('role', v)}
          />
          <ActiveFilter value={filters.active} onChange={(v) => setFilter('active', v)} />
        </AdvancedFilter>
        <UserTable
          data={users.data}
          loading={users.isFetching}
          error={users.error}
          onRetry={() => void users.refetch()}
          params={params}
          onParamsChange={onTableChange}
          roleName={roleName}
          onView={setViewing}
          onEdit={setEditing}
          onDelete={onDelete}
          onResetPassword={setResetting}
        />
      </Flex>
      <UserCreateModal open={creating} onClose={() => setCreating(false)} />
      <UserDetailModal
        open={Boolean(viewing)}
        user={viewing}
        roleName={roleName}
        onClose={() => setViewing(undefined)}
        onEdit={(u) => {
          setViewing(undefined)
          setEditing(u)
        }}
        onResetPassword={(u) => {
          setViewing(undefined)
          setResetting(u)
        }}
      />
      <UserEditModal user={editing} onClose={() => setEditing(undefined)} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(undefined)} />
    </PageContainer>
  )
}
