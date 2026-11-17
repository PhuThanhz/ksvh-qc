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
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 14,
          padding: '12px 20px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.65)',
        }}
      >
        <Flex justify="space-between" align="center" gap={12} wrap>
          <div>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                color: '#0f172a',
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
                  color: '#64748b',
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
