import { HomeOutlined, ReloadOutlined, RollbackOutlined } from '@ant-design/icons'
import { Button, Result, Space } from 'antd'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

interface State {
  hasError: boolean
  error: Error | null
}

class InnerErrorBoundary extends Component<{ children: ReactNode; onBack: () => void; onHome: () => void }, State> {
  override state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Đã bắt lỗi ở ErrorBoundary cấp nội dung để không làm sập layout
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px 16px', display: 'flex', justifyContent: 'center' }}>
          <Result
            status="500"
            title="Trang gặp sự cố"
            subTitle={
              <div>
                <p style={{ marginBottom: 8 }}>Hệ thống gặp sự cố khi hiển thị nội dung trang này. Khung điều hướng vẫn hoạt động bình thường.</p>
                {this.state.error?.message && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: 'var(--app-danger, #ff4d4f)',
                      background: 'rgba(255, 77, 79, 0.08)',
                      border: '1px solid rgba(255, 77, 79, 0.2)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      maxWidth: 600,
                      wordBreak: 'break-word',
                      textAlign: 'left',
                    }}
                  >
                    {this.state.error.message}
                  </div>
                )}
              </div>
            }
            extra={
              <Space wrap size="middle">
                <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                  Thử lại
                </Button>
                <Button icon={<RollbackOutlined />} onClick={this.props.onBack}>
                  Về trang trước
                </Button>
                <Button icon={<HomeOutlined />} onClick={this.props.onHome}>
                  Về trang chủ
                </Button>
              </Space>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * ErrorBoundary ở cấp nội dung trang:
 * - Bao quanh <Outlet /> trong AdminLayout / MobileLayout
 * - Bắt lỗi render từ bất kỳ ô bảng hay trang nào
 * - Giữ nguyên sidebar, header, menu điều hướng
 * - Tự động reset trạng thái lỗi khi đổi route (qua useLocation)
 */
export function ContentErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <InnerErrorBoundary
      key={location.pathname}
      onBack={() => navigate(-1)}
      onHome={() => navigate(location.pathname.startsWith('/qc') ? '/qc' : '/admin')}
    >
      {children}
    </InnerErrorBoundary>
  )
}
