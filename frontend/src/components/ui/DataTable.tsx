import { Pagination, Table, type TableProps } from 'antd'
import type { SorterResult } from 'antd/es/table/interface'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/data-display/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PAGE_SIZE_OPTIONS } from '@/constants/app.constants'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { PageParams, PageResponse } from '@/types/common.types'

export interface DataTableProps<T extends object> {
  columns: NonNullable<TableProps<T>['columns']>
  rowKey: (keyof T & string) | ((record: T) => string)
  data?: PageResponse<T>
  dataSource?: T[]
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  params?: PageParams
  onParamsChange?: (params: PageParams) => void
  mobileRender?: (item: T, index: number) => ReactNode
  scroll?: TableProps<T>['scroll']
  rowSelection?: TableProps<T>['rowSelection']
  className?: string
}

/**
 * Bảng dữ liệu chuẩn Apple Minimalist (DataTable):
 * - Header bảng: Nền xám nhạt trong suốt, chữ xám font-weight: 600, cỡ chữ 13px.
 * - Dòng dữ liệu: Chiều cao tối thiểu 52px, hover chuyển màu var(--apple-surface-hover).
 * - Phân trang gọn: Căn góc phải dưới, hiển thị rõ tổng số dòng và dropdown chọn số dòng/trang.
 * - Tự động fallback sang dạng thẻ trên thiết bị di động (< 768px).
 */
export function DataTable<T extends object>({
  columns,
  rowKey,
  data,
  dataSource,
  loading = false,
  error,
  onRetry,
  params,
  onParamsChange,
  mobileRender,
  scroll,
  rowSelection,
  className = '',
}: DataTableProps<T>) {
  const isMobile = useIsMobile()

  if (error && !data && !dataSource) return <ErrorState onRetry={onRetry} />

  const items = data ? data.items : (dataSource ?? [])
  const total = data ? data.totalItems : items.length

  const handleChange: TableProps<T>['onChange'] = (pagination, _filters, sorter) => {
    if (!onParamsChange || !params) return
    const s = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<T> | undefined
    const field = s?.order ? String(s.columnKey ?? s.field) : undefined
    onParamsChange({
      page: (pagination.current ?? 1) - 1,
      size: pagination.pageSize ?? params.size,
      ...(field ? { sort: `${field},${s?.order === 'ascend' ? 'asc' : 'desc'}` } : {}),
    })
  }

  const handleMobilePageChange = (page: number, size: number) => {
    if (!onParamsChange || !params) return
    onParamsChange({
      ...params,
      page: page - 1,
      size,
    })
  }

  const getKey = (item: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(item)
    return String(item[rowKey]) || String(index)
  }

  return (
    <div
      className={`data-table-apple-wrapper ${className}`.trim()}
      style={{
        background: 'var(--apple-surface-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--apple-border)',
        overflow: 'hidden',
      }}
    >
      {isMobile && mobileRender ? (
        <div style={{ padding: 12 }}>
          {loading && !items.length ? (
            <LoadingState />
          ) : !items.length ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, index) => (
                <div key={getKey(item, index)}>
                  {mobileRender(item, (params?.page ?? 0) * (params?.size ?? 10) + index)}
                </div>
              ))}
            </div>
          )}

          {Boolean(params && total > params.size) && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                simple
                current={params ? params.page + 1 : 1}
                pageSize={params?.size ?? 10}
                total={total}
                onChange={handleMobilePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <Table<T>
          columns={columns}
          dataSource={items}
          rowKey={rowKey}
          loading={loading}
          rowSelection={rowSelection}
          onChange={handleChange}
          scroll={scroll ?? { x: 'max-content' }}
          pagination={
            params && onParamsChange
              ? {
                  current: params.page + 1,
                  pageSize: params.size,
                  total,
                  showSizeChanger: true,
                  pageSizeOptions: [...PAGE_SIZE_OPTIONS],
                  showTotal: (t, range) => (
                    <span style={{ fontSize: 13, color: 'var(--apple-text-secondary)' }}>
                      Hiển thị {range[0]}-{range[1]} / Tổng số {t}
                    </span>
                  ),
                  style: { padding: '12px 16px', margin: 0 },
                }
              : false
          }
          locale={{ emptyText: <EmptyState /> }}
        />
      )}
    </div>
  )
}
