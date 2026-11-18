import { SafetyCertificateFilled } from '@ant-design/icons'
import { Card, Flex, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Khung trang đăng nhập chuẩn Apple/Enterprise glassmorphism. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `Đăng nhập · ${title}`
  }, [title])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px 16px',
        background: 'radial-gradient(ellipse at top, var(--app-chrome-solid-light) 0%, var(--app-chrome-solid) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Vòng sáng trang trí nền */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 113, 227, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          background: '#ffffff',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--app-on-dark-glass-border)',
          position: 'relative',
          zIndex: 1,
        }}
        styles={{ body: { padding: '32px 28px' } }}
      >
        <Flex vertical align="center" gap={8} style={{ marginBottom: 20 }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--app-chrome-solid-mid) 0%, var(--app-chrome-solid) 100%)',
              color: 'var(--app-on-dark)',
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.35)',
            }}
          >
            <SafetyCertificateFilled />
          </Flex>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: 'var(--app-text)' }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
              {subtitle}
            </Typography.Text>
          )}
        </Flex>

        {children}
      </Card>
    </div>
  )
}
