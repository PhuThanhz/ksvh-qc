import { Alert, Flex, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { TableCard } from '@/components/data-display/TableCard'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { PermissionToggleCell } from '@/features/roles/components/PermissionToggleCell'
import { usePermissionCatalog, useRoles } from '@/features/roles/hooks/useRoles'
import { lockReason, useTogglePermission } from '@/features/roles/hooks/useTogglePermission'
import { moduleLabel, type PermissionInfo } from '@/features/roles/roles.types'
import { PERMISSIONS, usePermission } from '@/permissions'

/**
 * Danh mục permission (định nghĩa trong code) và ma trận permission × vai trò.
 * Người có quyền role:manage bấm vào ô để cấp / thu quyền của vai trò (không thêm / xoá được mã quyền).
 */
export function PermissionListPage() {
  const { can } = usePermission()
  const canEdit = can(PERMISSIONS.ROLE.MANAGE)
  const { toggle, saving } = useTogglePermission()
  const catalog = usePermissionCatalog()
  const roles = useRoles()
  const [keyword, setKeyword] = useState('')

  const filteredList = useMemo(() => {
    const list = catalog.data ?? []
    if (!keyword.trim()) return list
    const q = keyword.trim().toLowerCase()
    return list.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        moduleLabel(p.module).toLowerCase().includes(q),
    )
  }, [catalog.data, keyword])

  const columns = useMemo<ColumnsType<PermissionInfo>>(
    () => [
      {
        title: 'Nhóm',
        dataIndex: 'module',
        fixed: 'left',
        width: 140,
        // Gộp ô nhóm cho các dòng liền kề cùng module trong danh sách đã lọc.
        onCell: (row, index = 0) => {
          if (index > 0 && filteredList[index - 1]?.module === row.module) return { rowSpan: 0 }
          let span = 1
          while (filteredList[index + span]?.module === row.module) span++
          return { rowSpan: span }
        },
        render: (m: string) => <Tag>{moduleLabel(m)}</Tag>,
      },
      {
        title: 'Quyền',
        dataIndex: 'description',
        fixed: 'left',
        width: 260,
        render: (d: string, p) => (
          <Flex vertical>
            <span style={{ fontWeight: 500 }}>{d}</span>
            <Typography.Text type="secondary" code>{p.code}</Typography.Text>
          </Flex>
        ),
      },
      ...(roles.data ?? []).map((r) => ({
        // Tiêu đề được xuống dòng để cột tiêu đề và cột dữ liệu luôn cùng độ rộng (bảng có scroll.y tách header riêng).
        title: (
          <span title={r.code} style={{ whiteSpace: 'normal', display: 'block', lineHeight: 1.3 }}>
            {r.name}
          </span>
        ),
        key: r.code,
        align: 'center' as const,
        width: 150,
        render: (_: unknown, p: PermissionInfo) => (
          <PermissionToggleCell
            granted={r.permissions.includes(p.code)}
            editable={canEdit && !saving}
            lockReason={canEdit ? lockReason(r, p) : null}
            onToggle={() => void toggle(r, p)}
          />
        ),
      })),
    ],
    [filteredList, roles.data, canEdit, saving, toggle],
  )

  const error = (catalog.error && !catalog.data) || (roles.error && !roles.data)

  return (
    <PageContainer
      title="Phân quyền chức năng"
      subtitle="Danh mục quyền hạn trong hệ thống và ma trận phân quyền theo vai trò"
    >
      <Flex vertical gap={16}>
        <Alert
          type="info"
          showIcon
          title={
            canEdit
              ? 'Nhấp vào từng ô để thiết lập hoặc thu hồi quyền hạn cho vai trò tương ứng. Danh mục quyền được quản lý tập trung theo mã hệ thống.'
              : 'Danh mục phân quyền hệ thống ở chế độ chỉ đọc.'
          }
        />
        <AdvancedFilter
          search={{ value: keyword, placeholder: 'Tìm theo tên quyền, mã code hoặc nhóm module...', onSearch: setKeyword }}
          extra={
            <Typography.Text className="filter-count">
              Hiển thị <strong>{filteredList.length}</strong> / {catalog.data?.length ?? 0} quyền
            </Typography.Text>
          }
        />
        {error ? (
          <ErrorState
            onRetry={() => {
              void catalog.refetch()
              void roles.refetch()
            }}
          />
        ) : (
          <TableCard>
            <Table<PermissionInfo>
              rowKey="code"
              bordered
              size="middle"
              loading={catalog.isFetching || roles.isFetching}
              dataSource={filteredList}
              columns={columns}
              pagination={false}
              // Tiêu đề cố định trong vùng cuộn của bảng (khung TableCard có overflow: hidden nên sticky theo trang không dùng được).
              scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
            />
          </TableCard>
        )}
      </Flex>
    </PageContainer>
  )
}
