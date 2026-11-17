import { Button, Card, ErrorBlock, Tag } from 'antd-mobile'
import { useNavigate } from 'react-router'
import type { InspectionResponse } from '@/features/inspections/inspection.types'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  tasks?: InspectionResponse[]
  loading?: boolean
}

export function InspectionTaskList({ tasks, loading }: Props) {
  const navigate = useNavigate()

  if (tasks && tasks.length > 0) {
    return (
      <>
        {tasks.map((t) => (
          <Card key={t.id} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{t.code}</span>
              <Tag color={t.status === 'IN_PROGRESS' ? 'warning' : 'primary'}>
                {t.status === 'IN_PROGRESS' ? 'Đang chấm' : 'Được giao'}
              </Tag>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--app-text)' }}>{t.restaurantName}</div>
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 4 }}>
              {INSPECTION_KIND_LABEL[t.inspectionType]} · {INSPECTION_MODE_LABEL[t.inspectionMode]}
              {t.topicNames.length > 0 ? ` · ${t.topicNames.join(', ')}` : t.templateName ? ` · ${t.templateName}` : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
              Ngày tạo: {formatDate(t.createdAt)}
            </div>
            <Button
              block
              color={t.status === 'IN_PROGRESS' ? 'warning' : 'primary'}
              size="middle"
              style={{ marginTop: 12, borderRadius: 8 }}
              onClick={() => navigate(`/qc/execute/${t.id}`)}
            >
              {t.status === 'IN_PROGRESS' ? 'Tiếp tục chấm điểm' : 'Bắt đầu kiểm tra (GPS)'}
            </Button>
          </Card>
        ))}
      </>
    )
  }

  if (!loading) {
    return (
      <ErrorBlock
        status="empty"
        style={{ '--image-height': '80px' }}
        title="Chưa có việc chấm"
        description="Kéo xuống để làm mới danh sách"
      />
    )
  }

  return null
}
