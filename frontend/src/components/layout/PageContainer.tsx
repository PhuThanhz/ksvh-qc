import { Flex, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface PageContainerProps {
  title: string
  subtitle?: ReactNode
  /** Nút hành động góc phải tiêu đề. */
  extra?: ReactNode
  children: ReactNode
}

/** Khung chuẩn Hub Shopee / Apple: Tiêu đề trực tiếp trên ảnh nền, nút hành động kính mờ / cam nổi bật */
export function PageContainer({ title, subtitle, extra, children }: PageContainerProps) {
  useEffect(() => {
    document.title = `${title} · KSVH QC`
  }, [title])

  return (
    <Flex vertical gap={16}>
      <div className="page-header page-container-header" style={{ marginBottom: 4 }}>
        <Flex justify="space-between" align="center" gap={12} wrap>
          <div>
            <Typography.Title
              level={2}
              className="page-title"
              style={{
                margin: 0,
                color: '#ffffff',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: 24,
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.45)',
              }}
            >
              {title}
            </Typography.Title>
            {subtitle && (
              <Typography.Text
                className="page-subtitle"
                style={{
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: 13.5,
                  marginTop: 4,
                  display: 'block',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.75), 0 2px 8px rgba(0, 0, 0, 0.5)',
                }}
              >
                {subtitle}
              </Typography.Text>
            )}
          </div>
          {extra && (
            <Flex align="center" gap={8} wrap className="page-header__actions" style={{ maxWidth: '100%' }}>
              {extra}
            </Flex>
          )}
        </Flex>
      </div>
      {children}
    </Flex>
  )
}
