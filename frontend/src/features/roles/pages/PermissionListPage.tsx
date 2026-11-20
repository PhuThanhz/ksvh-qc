import { Button, Flex, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useMemo, useState } from 'react'
import { TableActions } from '@/components/data-display/TableActions'
import { TableCard } from '@/components/data-display/TableCard'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { PageContainer } from '@/components/layout/PageContainer'
import { PermissionDetailModal } from '@/features/roles/components/PermissionDetailModal'
import { deriveApiMeta, PermissionFormModal } from '@/features/roles/components/PermissionFormModal'
import { usePermissionCatalog, useRoles } from '@/features/roles/hooks/useRoles'
import { MODULE_LABEL, moduleLabel, type PermissionInfo } from '@/features/roles/roles.types'
import { PERMISSIONS, ProtectedAction, usePermission } from '@/permissions'

type ExtendedPermission = PermissionInfo & { apiPath?: string; method?: string; isCustom?: boolean }

const METHOD_COLOR: Record<string, string> = {
  GET: '#16a34a',
  POST: '#2563eb',
  PUT: '#d97706',
  PATCH: '#0f172a',
  DELETE: '#dc2626',
}

/**
 * Danh mục permission (gán quyền cho vai trò làm ở form Vai trò).
 * Bảng danh sách tiêu chuẩn (Tên Permission, API Path, Method, Module, Xem chi tiết / Sửa / Xoá).
 */
export function PermissionListPage() {
  const { can } = usePermission()
  const canEdit = can(PERMISSIONS.ROLE.MANAGE)
  const confirm = useConfirm()
  const notify = useNotify()
  const catalog = usePermissionCatalog()
  const roles = useRoles()

  const [keyword, setKeyword] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined)
  const [methodFilter, setMethodFilter] = useState<string | undefined>(undefined)
  const [viewing, setViewing] = useState<ExtendedPermission | undefined>()
  const [formModal, setFormModal] = useState<{ open: boolean; permission?: ExtendedPermission }>({ open: false })
  const [customOverrides, setCustomOverrides] = useState<Record<string, ExtendedPermission>>({})
  const [deletedCodes, setDeletedCodes] = useState<Set<string>>(() => new Set())

  const roleList = useMemo(() => roles.data ?? [], [roles.data])

  const allPermissions = useMemo<ExtendedPermission[]>(() => {
    const base = (catalog.data ?? [])
      .filter((p) => !deletedCodes.has(p.code))
      .map((p) => {
        const override = customOverrides[p.code]
        const meta = deriveApiMeta(override ?? p)
        return {
          ...p,
          ...override,
          apiPath: meta.apiPath,
          method: meta.method,
        }
      })
    const added = Object.values(customOverrides).filter(
      (c) => !deletedCodes.has(c.code) && !(catalog.data ?? []).some((b) => b.code === c.code),
    )
    return [...added, ...base]
  }, [catalog.data, customOverrides, deletedCodes])

  const filteredList = useMemo(() => {
    let list = allPermissions
    if (moduleFilter) {
      list = list.filter((p) => p.module === moduleFilter)
    }
    if (methodFilter) {
      list = list.filter((p) => p.method === methodFilter)
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.apiPath && p.apiPath.toLowerCase().includes(q)) ||
          p.module.toLowerCase().includes(q) ||
          moduleLabel(p.module).toLowerCase().includes(q),
      )
    }
    return list
  }, [allPermissions, moduleFilter, methodFilter, keyword])

  const moduleOptions = useMemo(() => {
    const mods = Array.from(new Set(allPermissions.map((p) => p.module)))
    return mods.map((m) => ({ value: m, label: `${m.toUpperCase()} (${MODULE_LABEL[m] ?? m})` }))
  }, [allPermissions])

  const handleSavePermission = useCallback((saved: ExtendedPermission) => {
    setCustomOverrides((prev) => ({ ...prev, [saved.code]: saved }))
  }, [])

  const handleDeletePermission = useCallback(
    async (p: ExtendedPermission) => {
      const ok = await confirm({
        title: `Xoá quyền "${p.description}"?`,
        content: `Bạn có chắc chắn muốn xoá quyền "${p.description}" (${p.apiPath})?`,
        okText: 'Xoá',
        danger: true,
      })
      if (!ok) return
      setDeletedCodes((prev) => new Set([...prev, p.code]))
      notify.success(`Đã xoá quyền "${p.description}"`)
    },
    [confirm, notify],
  )

  const renderActions = useCallback(
    (p: ExtendedPermission) => (
      <TableActions
        onView={() => setViewing(p)}
        onEdit={() => setFormModal({ open: true, permission: p })}
        editLabel="Chỉnh sửa Permission"
        editAccess={PERMISSIONS.ROLE.MANAGE}
        onDelete={() => void handleDeletePermission(p)}
        deleteAccess={PERMISSIONS.ROLE.MANAGE}
        recordName={p.description}
      />
    ),
    [handleDeletePermission],
  )

  const listColumns = useMemo<ColumnsType<ExtendedPermission>>(
    () => [
      {
        title: '#',
        key: 'index',
        width: 56,
        align: 'center',
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Tên Permission',
        dataIndex: 'description',
        width: 290,
        render: (d: string, p) => (
          <div>
            <span className="cell-title-link" onClick={() => setViewing(p)}>
              {d}
            </span>
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
              Mã: <code>{p.code}</code>
            </div>
          </div>
        ),
      },
      {
        title: 'API Path',
        dataIndex: 'apiPath',
        width: 240,
        render: (path: string) => (
          <Typography.Text style={{ fontFamily: 'var(--font-family-code)', fontSize: 13, color: '#334155' }}>
            {path}
          </Typography.Text>
        ),
      },
      {
        title: 'Method',
        dataIndex: 'method',
        width: 110,
        render: (m: string) => (
          <span
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              color: METHOD_COLOR[m] ?? '#0f172a',
              fontFamily: 'var(--font-family-code)',
            }}
          >
            {m}
          </span>
        ),
      },
      {
        title: 'Module',
        dataIndex: 'module',
        width: 200,
        render: (m: string) => (
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: '#334155', fontFamily: 'var(--font-family-code)' }}>
              {m.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>{moduleLabel(m)}</div>
          </div>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: actionColumnWidth(3),
        className: 'col-actions',
        align: 'center',
        render: (_, p) => renderActions(p),
      },
    ],
    [renderActions],
  )

  const error = (catalog.error && !catalog.data) || (roles.error && !roles.data)
  const activeFilterCount = (moduleFilter ? 1 : 0) + (methodFilter ? 1 : 0) + (keyword.trim() ? 1 : 0)

  return (
    <PageContainer
      title="Quản lý quyền hạn"
      subtitle="Quản lý danh mục quyền hạn (Permission), đường dẫn API Path và phương thức HTTP; gán quyền cho vai trò ở trang Vai trò"
      extra={
        <ProtectedAction access={PERMISSIONS.ROLE.MANAGE}>
          <Button type="primary" onClick={() => setFormModal({ open: true })}>
            Thêm quyền
          </Button>
        </ProtectedAction>
      }
    >
      <Flex vertical gap={16}>
        <AdvancedFilter
          search={{
            value: keyword,
            placeholder: 'Tìm theo tên quyền, API path, mã code hoặc module...',
            onSearch: setKeyword,
          }}
          activeCount={activeFilterCount}
          onReset={() => {
            setKeyword('')
            setModuleFilter(undefined)
            setMethodFilter(undefined)
          }}
        >
          <Select
            allowClear
            placeholder="Thuộc Module"
            style={{ width: 230 }}
            value={moduleFilter}
            onChange={setModuleFilter}
            options={moduleOptions}
          />
          <Select
            allowClear
            placeholder="Method"
            style={{ width: 150 }}
            value={methodFilter}
            onChange={setMethodFilter}
            options={[
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'DELETE', label: 'DELETE' },
            ]}
          />
          <span className="app-stat-chip">
            Hiển thị <strong>{filteredList.length}</strong> / {allPermissions.length} quyền
          </span>
        </AdvancedFilter>

        {error ? (
          <ErrorState
            onRetry={() => {
              void catalog.refetch()
              void roles.refetch()
            }}
          />
        ) : (
          <TableCard>
            <Table<ExtendedPermission>
              rowKey="code"
              size="middle"
              loading={catalog.isFetching || roles.isFetching}
              dataSource={filteredList}
              columns={listColumns}
              pagination={false}
              scroll={{ x: 1050 }}
            />
          </TableCard>
        )}
      </Flex>

      <PermissionDetailModal
        open={Boolean(viewing)}
        permission={viewing}
        roles={roleList}
        canEdit={canEdit}
        onClose={() => setViewing(undefined)}
        onEdit={(p) => setFormModal({ open: true, permission: p })}
      />

      <PermissionFormModal
        open={formModal.open}
        permission={formModal.permission}
        onClose={() => setFormModal({ open: false })}
        onSave={handleSavePermission}
      />
    </PageContainer>
  )
}
