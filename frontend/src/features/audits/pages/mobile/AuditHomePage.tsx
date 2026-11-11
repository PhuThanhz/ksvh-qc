import { Button, ErrorBlock, Space } from 'antd-mobile'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { useSession } from '@/features/auth'

/** Danh sách việc chấm của người chấm. Lấy dữ liệu từ module audit sau khi chốt nghiệp vụ. */
export function AuditHomePage() {
  const { user } = useSession()
  const navigate = useNavigate()

  return (
    <Space direction="vertical" block style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Xin chào, {user?.fullName}</div>
      <ErrorBlock status="empty" title="Chưa có việc chấm" description="Danh sách việc chấm sẽ hiện ở đây" />
      <Button block color="primary" size="large" onClick={() => navigate(ROUTES.qc.checkinDemo)}>
        Thử GPS & chụp ảnh
      </Button>
    </Space>
  )
}
