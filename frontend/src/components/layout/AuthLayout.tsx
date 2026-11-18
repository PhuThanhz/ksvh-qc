import { SafetyCertificateFilled } from '@ant-design/icons'
import { Flex, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Khung trang đăng nhập đơn giản, tinh gọn, hiện đại */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `Đăng nhập · ${title}`
  }, [title])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: 24,
              margin: '0 auto 12px',
            }}
          >
            <SafetyCertificateFilled />
          </Flex>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'block' }}>
              {subtitle}
            </Typography.Text>
          )}
        </div>

        {children}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Typography.Text style={{ fontSize: 12, color: '#94a3b8' }}>
          KSVH QC © 2026 · Hệ thống Kiểm soát Vận hành & Tiêu chuẩn Chất lượng
        </Typography.Text>
      </div>
    </div>
  )
}
