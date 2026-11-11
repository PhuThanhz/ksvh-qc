import { Empty } from 'antd'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ description = 'Chưa có dữ liệu', action }: EmptyStateProps) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {action}
    </Empty>
  )
}
