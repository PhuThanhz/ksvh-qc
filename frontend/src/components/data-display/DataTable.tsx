import { Pagination, Table, type TableProps } from 'antd'
import type { SorterResult } from 'antd/es/table/interface'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/data-display/EmptyState'
import { TableCard } from '@/components/data-display/TableCard'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PAGE_SIZE_OPTIONS } from '@/constants/app.constants'
import { useIsMobile } from '@/hooks/useIsMobile'
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
  /** Render tuỳ chỉnh từng bản ghi dạng thẻ trên màn hình điện thoại (< 768px). */
  mobileRender?: (item: T, index: number) => ReactNode
  scroll?: TableProps<T>['scroll']
  /** Class riêng cho từng dòng (vd tô mép dòng cần chú ý). */
  rowClassName?: TableProps<T>['rowClassName']
}

/**
 * Bảng dữ liệu phân trang/sắp xếp phía server. Cột muốn sắp xếp: đặt `sorter: true` và `key` = tên trường API.
 * Trạng thái loading/rỗng/lỗi được xử lý thống nhất.
 * Tự động chuyển sang dạng thẻ trên điện thoại khi có prop `mobileRender`.
 */
export function DataTable<T extends object>(props: DataTableProps<T>) {
  const { columns, rowKey, data, loading, error, onRetry, params, onParamsChange, mobileRender, scroll, rowClassName } = props
  const isMobile = useIsMobile()

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

  const handleMobilePageChange = (page: number, size: number) => {
    onParamsChange({
      ...params,
      page: page - 1,
      size,
    })
  }

  return (
    <TableCard>
      {isMobile && mobileRender ? (
        <div>
          {loading && !data?.items?.length ? (
            <LoadingState />
          ) : !data?.items?.length ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
              {data.items.map((item, index) => (
                <div key={String(item[rowKey]) || index}>
                  {mobileRender(item, params.page * params.size + index)}
                </div>
              ))}
            </div>
          )}

          {Boolean(data?.totalItems && data.totalItems > params.size) && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                simple
                current={params.page + 1}
                pageSize={params.size}
                total={data?.totalItems ?? 0}
                onChange={handleMobilePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <Table<T>
          rowKey={rowKey}
          rowClassName={rowClassName}
          columns={columns}
          dataSource={data?.items}
          loading={loading}
          onChange={handleChange}
          locale={{ emptyText: <EmptyState /> }}
          scroll={scroll ?? { x: 'max-content' }}
          pagination={{
            current: params.page + 1,
            pageSize: params.size,
            total: data?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
            showTotal: (total) => `Tổng ${total}`,
          }}
        />
      )}
    </TableCard>
  )
}
