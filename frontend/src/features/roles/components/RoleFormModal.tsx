import {
  AppstoreOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Dropdown, Flex, Form, Input, Modal, Select, Switch, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormTextarea } from '@/components/data-entry/FormTextarea'
import { useNotify } from '@/components/feedback/useNotify'
import { usePermissionCatalog, useRoles, useSaveRole } from '@/features/roles/hooks/useRoles'
import { groupByModule, MODULE_LABEL, moduleLabel, type PermissionInfo, type Role } from '@/features/roles/roles.types'
import { roleSchema, type RoleFormValues } from '@/features/roles/schemas/role.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { nextSequentialCode, toUpperSnakeCode } from '@/utils/auto-code'

const EMPTY: RoleFormValues = { code: '', name: '', description: '', permissions: [] }

export interface RoleFormModalProps {
  open: boolean
  role?: Role
  onClose: () => void
}

function getPermissionMethodMeta(code: string): { method: string; color: string; path: string } {
  const [mod, action] = code.split(':')
  const basePath = `/api/v1/${mod}s`
  if (action?.includes('read')) {
    return { method: 'GET', color: '#16a34a', path: basePath }
  }
  if (action?.includes('create') || action?.includes('upload') || action?.includes('perform')) {
    return { method: 'POST', color: '#2563eb', path: basePath }
  }
  if (action?.includes('delete') || action?.includes('cancel')) {
    return { method: 'DELETE', color: '#dc2626', path: `${basePath}/{id}` }
  }
  return { method: 'PUT', color: '#d97706', path: `${basePath}/{id}` }
}

export function RoleFormModal({ open, role, onClose }: RoleFormModalProps) {
  const notify = useNotify()
  const save = useSaveRole()
  const catalog = usePermissionCatalog()
  const allRoles = useRoles()

  const [hideInfo, setHideInfo] = useState(false)
  const [permKeyword, setPermKeyword] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL')
  const [actionFilter, setActionFilter] = useState<string>('ALL')
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({})

  const { control, handleSubmit, reset, setError, setValue, formState } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: EMPTY,
  })

  const selectedList = useWatch({ control, name: 'permissions' }) ?? []
  const selectedSet = useMemo(() => new Set(selectedList), [selectedList])
  const existingCodes = useMemo(() => (allRoles.data ?? []).map((r) => r.code), [allRoles.data])
  const defaultCode = useMemo(() => nextSequentialCode('KSVH_ROLE', existingCodes, 2, '_'), [existingCodes])

  useEffect(() => {
    if (!open) return
    setHideInfo(false)
    setPermKeyword('')
    setModuleFilter('ALL')
    setStatusFilter('ALL')
    setActionFilter('ALL')
    setCollapsedModules({})
    reset(
      role
        ? { code: role.code, name: role.name, description: role.description ?? '', permissions: role.permissions }
        : { ...EMPTY, code: defaultCode },
    )
  }, [open, role, defaultCode, reset])

  const watchedName = useWatch({ control, name: 'name' })
  useEffect(() => {
    if (!open || role || formState.dirtyFields.code) return
    const trimmed = (watchedName ?? '').trim()
    const generated = trimmed ? toUpperSnakeCode(trimmed, 'KSVH', 40) : defaultCode
    setValue('code', generated, { shouldValidate: false })
  }, [open, role, watchedName, defaultCode, formState.dirtyFields.code, setValue])

  const allPerms = useMemo(() => catalog.data ?? [], [catalog.data])
  const allModules = useMemo(() => Array.from(new Set(allPerms.map((p) => p.module))), [allPerms])

  const filteredPerms = useMemo(() => {
    return allPerms.filter((p) => {
      if (moduleFilter !== 'ALL' && p.module !== moduleFilter) return false
      const isSelected = selectedSet.has(p.code)
      if (statusFilter === 'SELECTED' && !isSelected) return false
      if (statusFilter === 'UNSELECTED' && isSelected) return false
      if (actionFilter !== 'ALL') {
        const meta = getPermissionMethodMeta(p.code)
        if (meta.method !== actionFilter) return false
      }
      if (permKeyword.trim()) {
        const q = permKeyword.trim().toLowerCase()
        const meta = getPermissionMethodMeta(p.code)
        if (
          !p.description.toLowerCase().includes(q) &&
          !p.code.toLowerCase().includes(q) &&
          !moduleLabel(p.module).toLowerCase().includes(q) &&
          !meta.path.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [allPerms, moduleFilter, statusFilter, actionFilter, permKeyword, selectedSet])

  const groupedModules = useMemo(() => groupByModule(filteredPerms), [filteredPerms])

  const toggleCodes = (codes: readonly string[], turnOn: boolean) => {
    const next = new Set(selectedSet)
    codes.forEach((c) => (turnOn ? next.add(c) : next.delete(c)))
    setValue('permissions', [...next], { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: role?.id, body: { ...values, description: values.description || undefined } },
      {
        onSuccess: () => {
          notify.success(role ? 'Đã cập nhật vai trò' : 'Đã tạo vai trò mới')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" justify="space-between" style={{ paddingRight: 28 }}>
          <Flex align="center" gap={12}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <SafetyOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                {role ? `Chỉnh sửa vai trò: ${role.name}` : 'Tạo vai trò mới'}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 400, color: '#64748b', marginTop: 2 }}>
                Điền thông tin cơ bản và thiết lập quyền hạn theo từng module hệ thống
              </div>
            </div>
          </Flex>
          <Button
            size="small"
            icon={hideInfo ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setHideInfo((v) => !v)}
          >
            {hideInfo ? 'Hiện thông tin' : 'Ẩn thông tin'}
          </Button>
        </Flex>
      }
      width={1140}
      centered
      footer={
        <Flex align="center" justify="space-between">
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {selectedSet.size === 0
              ? 'Chưa chọn quyền hạn nào'
              : `Đã chọn ${selectedSet.size} / ${allPerms.length} quyền hạn hệ thống`}
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={onClose}>Huỷ</Button>
            <Button type="primary" loading={save.isPending} onClick={() => void onSubmit()}>
              {role ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </Flex>
        </Flex>
      }
      styles={{ body: { padding: 0, maxHeight: 'calc(100vh - 180px)', overflow: 'hidden' } }}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        <button type="submit" hidden />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: hideInfo ? '1fr' : '310px 1fr',
            height: 'calc(100vh - 220px)',
            minHeight: 520,
            maxHeight: 680,
          }}
        >
          {/* CỘT TRÁI: THÔNG TIN CƠ BẢN & TỔNG QUAN */}
          {!hideInfo && (
            <div
              style={{
                padding: '20px 20px',
                borderRight: '1px solid #eef2f6',
                background: '#fafbfc',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', color: '#475569' }}>
                  THÔNG TIN CƠ BẢN
                </span>
              </div>

              {role?.systemRole && (
                <Alert
                  type="info"
                  showIcon
                  style={{ fontSize: 12 }}
                  title="Vai trò gốc của hệ thống: không đổi mã, không xoá."
                />
              )}

              <div>
                <FormInput
                  control={control}
                  name="name"
                  label="Tên vai trò"
                  required
                  autoFocus={!role}
                  placeholder="VD: Giám sát KSVH"
                  maxLength={100}
                />
                <FormInput
                  control={control}
                  name="code"
                  label="Mã vai trò (Tự sinh theo tên)"
                  required
                  disabled={Boolean(role)}
                  placeholder="Tự động sinh"
                  maxLength={50}
                />
                <FormTextarea
                  control={control}
                  name="description"
                  label="Mô tả nhiệm vụ"
                  placeholder="Mô tả ngắn về phạm vi công việc của vai trò này..."
                  maxLength={255}
                  autoSize={{ minRows: 3, maxRows: 4 }}
                />
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                    Đang hoạt động
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>Có thể gán cho người dùng</div>
                </div>
                <Switch checked disabled />
              </div>

              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', color: '#475569' }}>
                    TỔNG QUAN
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div
                    style={{
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>
                      {selectedSet.size}
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>/{allPerms.length}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Quyền đã chọn</div>
                  </div>
                  <div
                    style={{
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {allModules.length}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Module hệ thống</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CỘT PHẢI: DANH SÁCH PHÂN QUYỀN */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #eef2f6' }}>
              <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#1e293b' }}>
                  PHÂN QUYỀN
                </span>
                <span style={{ fontSize: 12.5, color: '#64748b' }}>
                  Bật / tắt từng quyền hoặc toàn bộ module
                </span>
              </Flex>

              <Flex gap={8} wrap="wrap" align="center">
                <Input
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                  placeholder="Tìm theo tên quyền, mã code, API path, module..."
                  value={permKeyword}
                  onChange={(e) => setPermKeyword(e.target.value)}
                  style={{ flex: 1, minWidth: 220 }}
                />
                <Select
                  value={moduleFilter}
                  onChange={setModuleFilter}
                  style={{ width: 170 }}
                  options={[
                    { value: 'ALL', label: 'Tất cả lĩnh vực' },
                    ...allModules.map((m) => ({ value: m, label: MODULE_LABEL[m] ?? m })),
                  ]}
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 145 }}
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'SELECTED', label: 'Đã bật' },
                    { value: 'UNSELECTED', label: 'Chưa bật' },
                  ]}
                />
                <Select
                  value={actionFilter}
                  onChange={setActionFilter}
                  style={{ width: 140 }}
                  options={[
                    { value: 'ALL', label: 'Tất cả thao tác' },
                    { value: 'GET', label: 'GET (Xem)' },
                    { value: 'POST', label: 'POST (Tạo)' },
                    { value: 'PUT', label: 'PUT (Cập nhật)' },
                    { value: 'DELETE', label: 'DELETE (Xoá)' },
                  ]}
                />
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        key: 'select-all',
                        label: 'Bật tất cả quyền đang hiển thị',
                        onClick: () => toggleCodes(filteredPerms.map((p) => p.code), true),
                      },
                      {
                        key: 'clear-all',
                        label: 'Tắt tất cả quyền đang hiển thị',
                        onClick: () => toggleCodes(filteredPerms.map((p) => p.code), false),
                      },
                    ],
                  }}
                >
                  <Button>
                    Thao tác <DownOutlined style={{ fontSize: 11 }} />
                  </Button>
                </Dropdown>
              </Flex>
            </div>

            {/* Danh sách các nhóm module và thẻ quyền */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <Flex vertical gap={16}>
                {groupedModules.map(({ module, items }) => {
                  const codes = items.map((p) => p.code)
                  const allChecked = codes.length > 0 && codes.every((c) => selectedSet.has(c))
                  const isCollapsed = Boolean(collapsedModules[module])

                  return (
                    <div
                      key={module}
                      style={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        borderLeft: '3px solid #2563eb',
                        background: '#ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Header của Module */}
                      <Flex
                        align="center"
                        justify="space-between"
                        style={{
                          padding: '10px 16px',
                          background: '#f8fafc',
                          borderBottom: isCollapsed ? 'none' : '1px solid #eef2f6',
                        }}
                      >
                        <Flex
                          align="center"
                          gap={10}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                          onClick={() =>
                            setCollapsedModules((prev) => ({ ...prev, [module]: !prev[module] }))
                          }
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                            }}
                          >
                            <AppstoreOutlined />
                          </div>
                          <Typography.Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                            {moduleLabel(module)}
                          </Typography.Text>
                          <span className="code-tag--blue">{module.toUpperCase()}</span>
                          <Tag color="blue" style={{ margin: 0, borderRadius: 999 }}>
                            {items.length} quyền
                          </Tag>
                        </Flex>

                        <Flex align="center" gap={8}>
                          <span style={{ fontSize: 12.5, color: '#64748b' }}>Bật tất cả trong nhóm</span>
                          <Switch
                            size="small"
                            checked={allChecked}
                            onChange={(checked) => toggleCodes(codes, checked)}
                          />
                        </Flex>
                      </Flex>

                      {/* Lưới 2 cột các thẻ quyền */}
                      {!isCollapsed && (
                        <div
                          style={{
                            padding: 14,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                            gap: 10,
                          }}
                        >
                          {items.map((p: PermissionInfo) => {
                            const checked = selectedSet.has(p.code)
                            const meta = getPermissionMethodMeta(p.code)
                            return (
                              <div
                                key={p.code}
                                onClick={() => toggleCodes([p.code], !checked)}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  border: `1px solid ${checked ? '#93c5fd' : '#e2e8f0'}`,
                                  background: checked ? '#eff6ff' : '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 12,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Switch
                                  size="small"
                                  checked={checked}
                                  onClick={(_, e) => e.stopPropagation()}
                                  onChange={(val) => toggleCodes([p.code], val)}
                                  style={{ marginTop: 3 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 13.5,
                                      fontWeight: 600,
                                      color: '#0f172a',
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {p.description}
                                  </div>
                                  <Flex align="center" gap={6} wrap style={{ marginTop: 4 }}>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: meta.color,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: 5,
                                          height: 5,
                                          borderRadius: '50%',
                                          background: meta.color,
                                        }}
                                      />
                                      {meta.method}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11.5,
                                        fontFamily: 'var(--font-family-code)',
                                        color: '#64748b',
                                      }}
                                    >
                                      {meta.path} · {p.code}
                                    </span>
                                  </Flex>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </Flex>
            </div>
          </div>
        </div>
      </Form>
    </Modal>
  )
}
