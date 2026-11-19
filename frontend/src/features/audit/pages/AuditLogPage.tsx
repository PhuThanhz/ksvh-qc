import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { TableCard } from '@/components/data-display/TableCard'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { AuditActionTag } from '@/features/audit/components/AuditActionTag'
import { AuditLogDetailModal } from '@/features/audit/components/AuditLogDetailModal'
import { useAuditActions, useAuditLogs, useAuditTargetTypes } from '@/features/audit/hooks/useAuditLogs'
import { ACTION_LABELS, TARGET_LABELS, type AuditLogResponse, type AuditLogSearchParams } from '@/features/audit/audit.types'
import { useListParams } from '@/hooks/useListParams'
import { exportToCsv } from '@/utils/export-csv'
import { formatDateTime } from '@/utils/format-date'
import { ActionButton } from '@/components/data-display/TableActions'

export function AuditLogPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } =
    useListParams<AuditLogSearchParams>()

  const auditLogs = useAuditLogs(params)
  const actions = useAuditActions()
  const targetTypes = useAuditTargetTypes()
  const [selectedId, setSelectedId] = useState<number | undefined>()

  const onSearch = useCallback((kw: string) => setFilter('keyword', kw || undefined), [setFilter])

  const onExportCsv = () => {
    const list = auditLogs.data?.content ?? []
    if (list.length === 0) return
    exportToCsv(
      `nhat-ky-he-thong-${dayjs().format('YYYYMMDD')}`,
      [
        { header: 'ID', accessor: (l) => `#${l.id}` },
        { header: 'Thời gian', accessor: (l) => formatDateTime(l.createdAt) },
        { header: 'Tài khoản', accessor: (l) => l.username ?? '' },
        { header: 'Người thực hiện', accessor: (l) => l.userFullName ?? '' },
        { header: 'Hành động', accessor: (l) => ACTION_LABELS[l.action]?.label ?? l.action },
        { header: 'Loại đối tượng', accessor: (l) => TARGET_LABELS[l.targetType] ?? l.targetType },
        { header: 'Mã đối tượng', accessor: (l) => l.targetId ?? '' },
        { header: 'Nội dung tóm tắt', accessor: (l) => l.summary },
        { header: 'IP', accessor: (l) => l.ipAddress ?? '' },
      ],
      list,
    )
  }

  const columns: ColumnsType<AuditLogResponse> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 160,
      render: (d: string) => formatDateTime(d),
    },
    {
      title: 'Người thực hiện',
      width: 170,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.userFullName || r.username || 'Hệ thống'}</div>
          {r.userFullName && r.username && (
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>{r.username}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 160,
      render: (a: string) => <AuditActionTag action={a} />,
    },
    {
      title: 'Đối tượng',
      width: 170,
      render: (_, r) => (
        <div>
          <span style={{ color: 'var(--app-text-secondary)', fontSize: 12 }}>
            {TARGET_LABELS[r.targetType] || r.targetType}
          </span>
          {r.targetId && (
            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.targetId}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Nội dung tóm tắt',
      dataIndex: 'summary',
      render: (s: string) => <Typography.Text>{s}</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, r) => (
        <ActionButton tone="view" icon={<EyeOutlined />} tooltip="Xem chi tiết" onClick={() => setSelectedId(r.id)} />
      ),
    },
  ]

  return (
    <PageContainer
      title="Nhật ký hệ thống"
      subtitle="Theo dõi lịch sử thay đổi cấu hình, phân quyền, huỷ phiếu và các thao tác quản trị"
      extra={
        <Button icon={<DownloadOutlined />} onClick={onExportCsv} disabled={!auditLogs.data?.content?.length}>
          Xuất CSV
        </Button>
      }
    >
      <Flex vertical gap={16}>
        <AdvancedFilter
          search={{ placeholder: 'Tìm kiếm tóm tắt, người dùng, đối tượng...', value: filters.keyword, onSearch }}
          activeCount={activeFilterCount}
          onReset={resetFilters}
        >
          <Select
            placeholder="Hành động"
            allowClear
            showSearch
            value={filters.action}
            onChange={(v) => setFilter('action', v)}
            style={{ width: 190 }}
            options={actions.data?.map((a) => ({ value: a, label: ACTION_LABELS[a]?.label ?? a }))}
          />
          <Select
            placeholder="Loại đối tượng"
            allowClear
            showSearch
            value={filters.targetType}
            onChange={(v) => setFilter('targetType', v)}
            style={{ width: 170 }}
            options={targetTypes.data?.map((t) => ({ value: t, label: TARGET_LABELS[t] ?? t }))}
          />
          <DatePicker.RangePicker
            style={{ width: 240 }}
            format="DD/MM/YYYY"
            value={filters.fromDate && filters.toDate ? [dayjs(filters.fromDate), dayjs(filters.toDate)] : null}
            onChange={(dates) => {
              setFilter('fromDate', dates?.[0]?.format('YYYY-MM-DD'))
              setFilter('toDate', dates?.[1]?.format('YYYY-MM-DD'))
            }}
          />
        </AdvancedFilter>

        <TableCard>
          <Table
            columns={columns}
            dataSource={auditLogs.data?.content}
            rowKey="id"
            loading={auditLogs.isLoading}
            scroll={{ x: 1000 }}
            pagination={{
              current: params.page + 1,
              pageSize: params.size,
              total: auditLogs.data?.totalElements,
              showSizeChanger: true,
              onChange: (p, s) => onTableChange({ page: p - 1, size: s }),
            }}
            size="middle"
          />
        </TableCard>
      </Flex>

      <AuditLogDetailModal
        open={Boolean(selectedId)}
        logId={selectedId}
        onClose={() => setSelectedId(undefined)}
      />
    </PageContainer>
  )
}
