import { Card, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Khung trang đăng nhập, dùng được trên cả máy tính và điện thoại. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `Đăng nhập · ${title}`
  }, [title])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginTop: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
            {subtitle}
          </Typography.Paragraph>
        )}
        {children}
      </Card>
    </div>
  )
}
