import { Flex, Typography } from 'antd'
import { useEffect, type CSSProperties, type ReactNode } from 'react'

export interface PageContainerProps {
  title: string
  subtitle?: ReactNode
  extra?: ReactNode
  children: ReactNode
  style?: CSSProperties
  className?: string
}

/**
 * Khung chứa chuẩn Apple Glass & Minimalist cho toàn bộ các trang:
 * - Bọc trong Card lớn bo góc 18px (--radius-lg).
 * - Nền trắng tuyệt đối (--apple-surface-card).
 * - Padding chuẩn 24px, viền mờ 1px solid var(--apple-border).
 * - Đổ bóng nhẹ đa tầng var(--apple-shadow-sm).
 */
export function PageContainer({
  title,
  subtitle,
  extra,
  children,
  style,
  className = '',
}: PageContainerProps) {
  useEffect(() => {
    document.title = `${title} · KSVH QC`
  }, [title])

  return (
    <div
      className={`page-container-apple ${className}`.trim()}
      style={{
        background: 'var(--apple-surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--apple-border)',
        boxShadow: 'var(--apple-shadow-sm)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        minHeight: '100%',
        ...style,
      }}
    >
      {/* Page Header */}
      <Flex justify="space-between" align="center" gap={16} wrap>
        <div>
          <Typography.Title
            level={3}
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--apple-text-primary)',
            }}
          >
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text
              style={{
                fontSize: 13.5,
                color: 'var(--apple-text-secondary)',
                marginTop: 4,
                display: 'block',
              }}
            >
              {subtitle}
            </Typography.Text>
          )}
        </div>

        {extra && (
          <Flex align="center" gap={10} wrap>
            {extra}
          </Flex>
        )}
      </Flex>

      {/* Main Content View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}
