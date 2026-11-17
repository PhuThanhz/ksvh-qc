import {
  AuditOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  SafetyCertificateFilled,
  SafetyCertificateOutlined,
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
    icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: '#38bdf8' }} />,
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

/** Khung trang đăng nhập Enterprise chuẩn Apple Frosted Glass sáng trong, sang trọng. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `Đăng nhập · ${title}`
  }, [title])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#eef2f6',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Nền phong cảnh núi tuyết hoàng hôn được làm mờ quang học mượt mà */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=85")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(32px)',
          transform: 'scale(1.08)',
          pointerEvents: 'none',
        }}
      />
      {/* Lớp phủ ánh sáng Apple Light Frosted (sáng trong, thanh lịch, không bị tối) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.48)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          pointerEvents: 'none',
        }}
      />

      {/* CỘT TRÁI: Enterprise Brand & Feature Showcase (Kính mờ sáng Apple) */}
      <div
        style={{
          flex: '1 1 55%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
          zIndex: 1,
          borderRight: '1px solid rgba(255, 255, 255, 0.7)',
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
        }}
        className="auth-hero-pane"
      >
        <div>
          {/* Brand Tag Header */}
          <Flex align="center" gap={10} style={{ marginBottom: 36 }}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#0f172a',
                fontSize: 20,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
              }}
            >
              <SafetyCertificateFilled />
            </Flex>
            <Typography.Text strong style={{ fontSize: 20, color: '#0f172a', letterSpacing: -0.3 }}>
              KSVH QC
            </Typography.Text>
            <Tag style={{ background: 'rgba(255, 255, 255, 0.75)', color: '#475569', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
              ENTERPRISE PRO
            </Tag>
          </Flex>

          {/* Hero Headline */}
          <div style={{ maxWidth: 540 }}>
            <Typography.Title
              level={2}
              style={{
                color: '#0f172a',
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
                color: '#475569',
                fontSize: 15,
                lineHeight: 1.6,
                marginTop: 14,
                marginBottom: 32,
              }}
            >
              Nền tảng số hóa toàn diện quy trình kiểm tra chất lượng, giám sát an toàn vệ sinh thực phẩm và phân loại rủi ro cho chuỗi nhà hàng ẩm thực F&B.
            </Typography.Paragraph>
          </div>

          {/* Value Pillars List */}
          <Flex vertical gap={14} style={{ maxWidth: 520 }}>
            {HERO_FEATURES.map((item, idx) => (
              <Flex
                key={idx}
                align="flex-start"
                gap={14}
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ padding: 4, background: 'rgba(255, 255, 255, 0.85)', borderRadius: 8, display: 'flex', border: '1px solid rgba(255, 255, 255, 0.9)' }}>
                  {item.icon}
                </div>
                <div>
                  <Typography.Text strong style={{ color: '#0f172a', fontSize: 14, display: 'block' }}>
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
        <Flex align="center" justify="space-between" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: 18 }}>
          <Flex align="center" gap={6}>
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 14 }} />
            <Typography.Text style={{ color: '#475569', fontSize: 12.5, fontWeight: 500 }}>
              Tiêu chuẩn ISO 22000 & HACCP Compliant
            </Typography.Text>
          </Flex>
          <Typography.Text style={{ color: '#64748b', fontSize: 12 }}>
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
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(30px) saturate(190%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            borderRadius: 20,
            padding: '36px 32px',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
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
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#0f172a',
                fontSize: 22,
                margin: '0 auto 14px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
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
