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
        background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
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
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25), 0 0 1px rgba(255, 255, 255, 0.4) inset',
          border: '1px solid rgba(255, 255, 255, 0.3)',
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
              background: 'linear-gradient(135deg, #0071e3 0%, #0056b3 100%)',
              color: '#ffffff',
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(0, 113, 227, 0.35)',
            }}
          >
            <SafetyCertificateFilled />
          </Flex>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: '#0f172a' }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ fontSize: 13, color: '#64748b' }}>
              {subtitle}
            </Typography.Text>
          )}
        </Flex>

        {children}
      </Card>
    </div>
  )
}
