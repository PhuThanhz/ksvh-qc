import { Button, ErrorBlock, Space } from 'antd-mobile'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/authStore'

/** Danh sách việc chấm của người chấm. Sẽ lấy dữ liệu từ module audit sau khi chốt nghiệp vụ. */
export function QcHomePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <Space direction="vertical" block style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Xin chào, {user?.fullName}</div>
      <ErrorBlock status="empty" title="Chưa có việc chấm" description="Danh sách việc chấm sẽ hiện ở đây" />
      <Button block color="primary" size="large" onClick={() => navigate('/qc/checkin-demo')}>
        Thử GPS & chụp ảnh
      </Button>
    </Space>
  )
}
