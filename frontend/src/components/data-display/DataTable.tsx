import { Table, type TableProps } from 'antd'
import type { SorterResult } from 'antd/es/table/interface'
import { EmptyState } from '@/components/data-display/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PAGE_SIZE_OPTIONS } from '@/constants/app.constants'
import type { PageParams, PageResponse } from '@/types/common.types'

export interface DataTableProps<T extends object> {
  columns: NonNullable<TableProps<T>['columns']>
  rowKey: keyof T & string
  data: PageResponse<T> | undefined
  loading: boolean
  error?: unknown
  onRetry?: () => void
  params: PageParams
  onParamsChange: (params: PageParams) => void
}

/**
 * Bảng dữ liệu phân trang/sắp xếp phía server. Cột muốn sắp xếp: đặt `sorter: true` và `key` = tên trường API.
 * Trạng thái loading/rỗng/lỗi được xử lý thống nhất.
 */
export function DataTable<T extends object>(props: DataTableProps<T>) {
  const { columns, rowKey, data, loading, error, onRetry, params, onParamsChange } = props

  if (error && !data) return <ErrorState onRetry={onRetry} />

  const handleChange: TableProps<T>['onChange'] = (pagination, _filters, sorter) => {
    const s = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<T> | undefined
    const field = s?.order ? String(s.columnKey ?? s.field) : undefined
    onParamsChange({
      page: (pagination.current ?? 1) - 1,
      size: pagination.pageSize ?? params.size,
      ...(field ? { sort: `${field},${s?.order === 'ascend' ? 'asc' : 'desc'}` } : {}),
    })
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.65)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        padding: '6px 14px 14px 14px',
        overflow: 'hidden',
      }}
    >
      <Table<T>
        rowKey={rowKey}
        columns={columns}
        dataSource={data?.items}
        loading={loading}
        onChange={handleChange}
        locale={{ emptyText: <EmptyState /> }}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: params.page + 1,
          pageSize: params.size,
          total: data?.totalItems ?? 0,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
          showTotal: (total) => `Tổng ${total}`,
        }}
      />
    </div>
  )
}
