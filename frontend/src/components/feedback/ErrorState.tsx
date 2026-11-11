import { Button, Result } from 'antd'
import type { ReactNode } from 'react'

type ErrorKind = 403 | 404 | 500 | 'error'

const DEFAULTS: Record<ErrorKind, { title: string; description: string }> = {
  403: { title: 'Không có quyền truy cập', description: 'Bạn không có quyền xem trang này.' },
  404: { title: 'Không tìm thấy', description: 'Trang hoặc dữ liệu bạn tìm không tồn tại.' },
  500: { title: 'Hệ thống gặp sự cố', description: 'Vui lòng thử lại sau ít phút.' },
  error: { title: 'Có lỗi xảy ra', description: 'Không tải được dữ liệu.' },
}

export interface ErrorStateProps {
  kind?: ErrorKind
  title?: string
  description?: ReactNode
  onRetry?: () => void
  extra?: ReactNode
}

export function ErrorState({ kind = 'error', title, description, onRetry, extra }: ErrorStateProps) {
  const d = DEFAULTS[kind]
  return (
    <Result
      status={kind === 'error' ? 'warning' : kind}
      title={title ?? d.title}
      subTitle={description ?? d.description}
      extra={extra ?? (onRetry && <Button onClick={onRetry}>Thử lại</Button>)}
    />
  )
}
