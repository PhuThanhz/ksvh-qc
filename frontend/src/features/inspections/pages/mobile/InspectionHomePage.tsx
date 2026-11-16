import { Button, Card, ErrorBlock, Space, Tag } from 'antd-mobile'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { useSession } from '@/features/auth'
import { useMyTasks } from '@/features/inspections/hooks/useInspectionData'
import type { InspectionResponse } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL } from '@/features/inspections/inspection.types'

export function InspectionHomePage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const { data: tasks, isLoading, refetch } = useMyTasks()

  const onOpenTask = (t: InspectionResponse) => {
    navigate(`/qc/execute/${t.id}`)
  }

  return (
    <Space direction="vertical" block style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>Chuyên viên KSVH</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.fullName}</div>
        </div>
        <Button size="small" fill="outline" onClick={() => { void refetch() }}>Làm mới</Button>
      </div>

      <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600 }}>
        Việc chấm cần làm ({tasks?.length || 0})
      </div>

      {tasks && tasks.length > 0 ? (
        tasks.map((t) => (
          <Card key={t.id} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{t.code}</span>
              <Tag color={t.status === 'IN_PROGRESS' ? 'warning' : 'primary'}>
                {t.status === 'IN_PROGRESS' ? 'Đang chấm' : 'Được giao'}
              </Tag>
            </div>

            <div style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>{t.restaurantName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {INSPECTION_KIND_LABEL[t.inspectionType]} · {INSPECTION_MODE_LABEL[t.inspectionMode]}
              {t.topicNames.length > 0 ? ` · ${t.topicNames.join(', ')}` : t.templateName ? ` · ${t.templateName}` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              Ngày tạo: {formatDate(t.createdAt)}
            </div>

            <Button
              block
              color={t.status === 'IN_PROGRESS' ? 'warning' : 'primary'}
              size="middle"
              style={{ marginTop: 12, borderRadius: 8 }}
              onClick={() => onOpenTask(t)}
            >
              {t.status === 'IN_PROGRESS' ? 'Tiếp tục chấm điểm' : 'Bắt đầu kiểm tra (GPS)'}
            </Button>
          </Card>
        ))
      ) : (
        !isLoading && (
          <ErrorBlock
            status="empty"
            title="Chưa có việc chấm"
            description="Bạn chưa được phân công đợt kiểm tra nào đang diễn ra"
          />
        )
      )}

      <div style={{ marginTop: 16 }}>
        <Button block fill="outline" size="middle" onClick={() => navigate(ROUTES.qc.checkinDemo)}>
          Thử GPS & chụp ảnh mẫu
        </Button>
      </div>
    </Space>
  )
}
