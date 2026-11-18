import { CheckOutlined } from '@ant-design/icons'
import { Alert, Flex, Table, Tag, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { TableCard } from '@/components/data-display/TableCard'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { usePermissionCatalog, useRoles } from '@/features/roles/hooks/useRoles'
import { moduleLabel, type PermissionInfo } from '@/features/roles/roles.types'

/** Danh mục permission (định nghĩa trong code) và ma trận permission × vai trò. Chỉ xem. */
export function PermissionListPage() {
  const { token } = theme.useToken()
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
        title: <span title={r.code}>{r.name}</span>,
        key: r.code,
        align: 'center' as const,
        width: 124,
        render: (_: unknown, p: PermissionInfo) =>
          p.roles.includes(r.code) ? <CheckOutlined style={{ color: token.colorSuccess, fontSize: 16 }} aria-label="Có quyền" /> : null,
      })),
    ],
    [filteredList, roles.data, token.colorSuccess],
  )

  const error = (catalog.error && !catalog.data) || (roles.error && !roles.data)

  return (
    <PageContainer title="Quyền (Permission)" subtitle="Danh mục quyền của hệ thống và vai trò nào đang có quyền đó">
      <Flex vertical gap={16}>
        <Alert
          type="info"
          showIcon
          title="Quyền được định nghĩa trong code (backend kiểm tra bằng @PreAuthorize) nên chỉ xem ở đây. Muốn gán / bỏ quyền cho vai trò, vào trang Vai trò."
        />
        <AdvancedFilter
          search={{ value: keyword, placeholder: 'Tìm theo tên quyền, mã code hoặc nhóm module...', maxWidth: 380, onSearch: setKeyword }}
          extra={
            <Typography.Text type="secondary">
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
              scroll={{ x: 'max-content' }}
              sticky={{ offsetHeader: 64 }}
            />
          </TableCard>
        )}
      </Flex>
    </PageContainer>
  )
}
