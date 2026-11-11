import { Flex, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface PageContainerProps {
  title: string
  subtitle?: ReactNode
  /** Nút hành động góc phải tiêu đề. */
  extra?: ReactNode
  children: ReactNode
}

/** Khung chuẩn cho mọi trang dashboard: tiêu đề, mô tả, hành động, nội dung. Tự đặt tiêu đề tab. */
export function PageContainer({ title, subtitle, extra, children }: PageContainerProps) {
  useEffect(() => {
    document.title = `${title} · KSVH QC`
  }, [title])

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-start" gap={16} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </div>
        {extra}
      </Flex>
      {children}
    </Flex>
  )
}
