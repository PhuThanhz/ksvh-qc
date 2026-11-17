import { Flex, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface PageContainerProps {
  title: string
  subtitle?: ReactNode
  /** Nút hành động góc phải tiêu đề. */
  extra?: ReactNode
  children: ReactNode
}

/** Khung chuẩn Enterprise cho trang dashboard: tiêu đề, mô tả, hành động, nội dung sắc nét. */
export function PageContainer({ title, subtitle, extra, children }: PageContainerProps) {
  useEffect(() => {
    document.title = `${title} · KSVH QC`
  }, [title])

  return (
    <Flex vertical gap={12}>
      <div
        style={{
          background: 'var(--app-surface)',
          borderRadius: 10,
          padding: '14px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--app-border)',
        }}
      >
        <Flex justify="space-between" align="center" gap={12} wrap>
          <div>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                color: 'var(--app-text)',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                fontSize: 18,
              }}
            >
              {title}
            </Typography.Title>
            {subtitle && (
              <Typography.Text
                style={{
                  color: 'var(--app-text-secondary)',
                  fontSize: 13,
                  marginTop: 2,
                  display: 'block',
                }}
              >
                {subtitle}
              </Typography.Text>
            )}
          </div>
          {extra}
        </Flex>
      </div>
      {children}
    </Flex>
  )
}
