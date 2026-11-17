import { HomeOutlined, ReloadOutlined, RollbackOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'

/** errorElement cho route: bắt lỗi render/tải chunk để không trắng màn hình. */
export function RouteErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorState
        kind={404}
        extra={
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => window.history.back()}>
              Về trang trước
            </Button>
            <Button type="primary" icon={<HomeOutlined />} onClick={() => { window.location.href = '/' }}>
              Về trang chủ
            </Button>
          </Space>
        }
      />
    )
  }

  const errorMessage = error instanceof Error ? error.message : undefined

  return (
    <ErrorState
      kind={500}
      description={
        errorMessage ? (
          <div>
            <p>Hệ thống gặp sự cố khi tải trang. Vui lòng thử lại sau ít phút.</p>
            <code
              style={{
                fontSize: 12,
                color: 'var(--app-danger, #ff4d4f)',
                background: 'rgba(255, 77, 79, 0.08)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {errorMessage}
            </code>
          </div>
        ) : undefined
      }
      extra={
        <Space wrap size="middle">
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
          <Button icon={<RollbackOutlined />} onClick={() => window.history.back()}>
            Về trang trước
          </Button>
          <Button icon={<HomeOutlined />} onClick={() => { window.location.href = '/' }}>
            Về trang chủ
          </Button>
        </Space>
      }
    />
  )
}
