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
    <Flex vertical gap={12}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 14,
          padding: '12px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
        }}
      >
        <Flex justify="space-between" align="center" gap={12} wrap>
          <div>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                color: '#1d1d1f',
                fontWeight: 700,
                letterSpacing: -0.2,
                fontSize: 18,
              }}
            >
              {title}
            </Typography.Title>
            {subtitle && (
              <Typography.Text
                style={{
                  color: '#6e6e73',
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
