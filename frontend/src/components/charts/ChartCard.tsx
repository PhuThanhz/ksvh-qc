import { Card, Empty, Flex, Skeleton, Typography } from 'antd'
import type { ReactNode } from 'react'

export interface ChartCardProps {
  title: string
  subtitle?: ReactNode
  extra?: ReactNode
  loading?: boolean
  /** true → hiện trạng thái trống thay cho biểu đồ. */
  empty?: boolean
  emptyText?: string
  height: number
  children: ReactNode
}

/** Khung chuẩn cho một biểu đồ: tiêu đề, mô tả ngắn, trạng thái tải / trống giữ nguyên chiều cao. */
export function ChartCard({ title, subtitle, extra, loading, empty, emptyText, height, children }: ChartCardProps) {
  return (
    <Card style={{ height: '100%' }} styles={{ body: { padding: 20, height: '100%' } }}>
      <Flex justify="space-between" align="flex-start" gap={12} style={{ marginBottom: 12 }}>
        <div>
          <Typography.Text strong style={{ fontSize: 14, color: '#0b0b0b' }}>
            {title}
          </Typography.Text>
          {subtitle && (
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {extra}
      </Flex>
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} title={false} style={{ height }} />
      ) : empty ? (
        <Flex align="center" justify="center" style={{ height }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText ?? 'Chưa có dữ liệu'} />
        </Flex>
      ) : (
        children
      )}
    </Card>
  )
}
