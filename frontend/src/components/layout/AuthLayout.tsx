import {
  AuditOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  SafetyCertificateFilled,
  ShieldCheckOutlined,
} from '@ant-design/icons'
import { Flex, Tag, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'

export interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

const HERO_FEATURES = [
  {
    icon: <ShieldCheckOutlined style={{ fontSize: 18, color: '#38bdf8' }} />,
    title: 'Kiểm soát tuân thủ thời gian thực',
    desc: 'Lập kế hoạch, chấm điểm phiếu định kỳ & đột xuất theo chuẩn VSATTP',
  },
  {
    icon: <AuditOutlined style={{ fontSize: 18, color: '#fbbf24' }} />,
    title: 'Phân loại rủi ro M1 – M4 chuẩn hóa',
    desc: 'Tự động kích hoạt quy trình khắc phục, giải trình và nghiệm thu số',
  },
  {
    icon: <LineChartOutlined style={{ fontSize: 18, color: '#34d399' }} />,
    title: 'Báo cáo quản trị & Phân tích chuỗi',
    desc: 'Đo lường tỷ lệ tuân thủ, xu hướng vi phạm theo từng cơ sở F&B',
  },
]

/** Khung trang đăng nhập Enterprise chuẩn Split-Screen với kính mờ sang trọng. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `Đăng nhập · ${title}`
  }, [title])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#090d16',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Vòng sáng phát quang nền */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '10%',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '30%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* CỘT TRÁI: Enterprise Brand & Feature Showcase (Ẩn trên màn hình nhỏ) */}
      <div
        style={{
          flex: '1 1 55%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
          zIndex: 1,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(9, 13, 22, 0.95) 100%)',
        }}
        className="auth-hero-pane"
      >
        <div>
          {/* Brand Tag Header */}
          <Flex align="center" gap={10} style={{ marginBottom: 40 }}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: 20,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <SafetyCertificateFilled />
            </Flex>
            <Typography.Text strong style={{ fontSize: 20, color: '#ffffff', letterSpacing: -0.3 }}>
              KSVH QC
            </Typography.Text>
            <Tag style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
              ENTERPRISE PRO
            </Tag>
          </Flex>

          {/* Hero Headline */}
          <div style={{ maxWidth: 540 }}>
            <Typography.Title
              level={2}
              style={{
                color: '#ffffff',
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: -0.6,
                margin: 0,
              }}
            >
              Hệ thống Kiểm soát Vận hành & Tiêu chuẩn Chất lượng
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: '#94a3b8',
                fontSize: 15,
                lineHeight: 1.6,
                marginTop: 14,
                marginBottom: 36,
              }}
            >
              Nền tảng số hóa toàn diện quy trình kiểm tra chất lượng, giám sát an toàn vệ sinh thực phẩm và phân loại rủi ro cho chuỗi nhà hàng ẩm thực F&B.
            </Typography.Paragraph>
          </div>

          {/* Value Pillars List */}
          <Flex vertical gap={18} style={{ maxWidth: 520 }}>
            {HERO_FEATURES.map((item, idx) => (
              <Flex
                key={idx}
                align="flex-start"
                gap={14}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ padding: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8, display: 'flex' }}>
                  {item.icon}
                </div>
                <div>
                  <Typography.Text strong style={{ color: '#f8fafc', fontSize: 14, display: 'block' }}>
                    {item.title}
                  </Typography.Text>
                  <Typography.Text style={{ color: '#64748b', fontSize: 12.5, marginTop: 2, display: 'block' }}>
                    {item.desc}
                  </Typography.Text>
                </div>
              </Flex>
            ))}
          </Flex>
        </div>

        {/* Footer Trust Bar */}
        <Flex align="center" justify="space-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 20 }}>
          <Flex align="center" gap={6}>
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 13 }} />
            <Typography.Text style={{ color: '#64748b', fontSize: 12 }}>
              Tiêu chuẩn ISO 22000 & HACCP Compliant
            </Typography.Text>
          </Flex>
          <Typography.Text style={{ color: '#475569', fontSize: 12 }}>
            Phiên bản 2.4 · KSVH Enterprise
          </Typography.Text>
        </Flex>
      </div>

      {/* CỘT PHẢI: Form Đăng nhập kính mờ chuẩn sang trọng */}
      <div style={{ flex: '1 1 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 2 }}>
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: 18,
            padding: '36px 32px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.6) inset',
            border: '1px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Header trong thẻ đăng nhập */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#0f172a',
                color: '#ffffff',
                fontSize: 22,
                margin: '0 auto 14px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              }}
            >
              <SafetyCertificateFilled />
            </Flex>
            <Typography.Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: -0.4, color: '#0f172a' }}>
              Đăng nhập hệ thống
            </Typography.Title>
            <Typography.Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'block' }}>
              {subtitle ?? 'Nhập thông tin xác thực định danh để tiếp tục'}
            </Typography.Text>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
