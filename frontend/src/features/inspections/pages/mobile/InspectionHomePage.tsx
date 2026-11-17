import { Button, Card, ErrorBlock, Segmented, Space, Tag } from 'antd-mobile'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSession } from '@/features/auth'
import { FindingActionModal, type FindingActionType } from '@/features/inspections/components/FindingActionModal'
import { InspectionFormModal } from '@/features/inspections/components/InspectionFormModal'
import { MobileFindingCard } from '@/features/inspections/components/mobile/MobileFindingCard'
import { useFindings, useMyTasks } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL } from '@/features/inspections/inspection.types'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate } from '@/utils/format-date'

export function InspectionHomePage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const { allows } = usePermission()

  const canPerform = allows(PERMISSIONS.INSPECTION.PERFORM)
  const canRespond = allows(PERMISSIONS.FINDING.RESPOND)
  const canRemediate = allows(PERMISSIONS.FINDING.REMEDIATE)
  const canCreate = allows(PERMISSIONS.PLAN.CREATE)

  const isStore = user?.roles?.includes('STORE_MANAGER') ?? false
  const [tab, setTab] = useState<'tasks' | 'findings'>(isStore && !canPerform ? 'findings' : 'tasks')

  const { data: tasks, isLoading: loadingTasks, refetch: refetchTasks } = useMyTasks()
  const { data: findingsPage, isLoading: loadingFindings, refetch: refetchFindings } = useFindings({ page: 0, size: 50 })

  const [createModal, setCreateModal] = useState(false)
  const [actionState, setActionState] = useState<{ open: boolean; action?: FindingActionType; finding?: FindingResponse }>({ open: false })

  const roleTitle = isStore ? 'Cửa hàng trưởng' : user?.roles?.includes('SYSTEM_ADMIN') ? 'Quản trị hệ thống' : 'Chuyên viên KSVH'

  const onOpenAction = (f: FindingResponse, a: FindingActionType) => {
    setActionState({ open: true, action: a, finding: f })
  }

  const handleRefresh = () => {
    void refetchTasks()
    void refetchFindings()
  }

  return (
    <Space direction="vertical" block style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>{roleTitle}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.fullName}</div>
        </div>
        <Button size="small" fill="outline" onClick={handleRefresh}>Làm mới</Button>
      </div>

      {(canPerform || canCreate) && (canRespond || canRemediate) && (
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as 'tasks' | 'findings')}
          options={[
            { label: `Việc chấm (${tasks?.length ?? 0})`, value: 'tasks' },
            { label: `Lỗi xử lý (${findingsPage?.totalItems ?? 0})`, value: 'findings' },
          ]}
        />
      )}

      {tab === 'tasks' && (
        <>
          {canCreate && (
            <Button block color="primary" fill="outline" size="middle" onClick={() => setCreateModal(true)}>
              + Tạo phiếu kiểm tra mới
            </Button>
          )}

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
                  onClick={() => navigate(`/qc/execute/${t.id}`)}
                >
                  {t.status === 'IN_PROGRESS' ? 'Tiếp tục chấm điểm' : 'Bắt đầu kiểm tra (GPS)'}
                </Button>
              </Card>
            ))
          ) : (
            !loadingTasks && (
              <ErrorBlock status="empty" title="Chưa có việc chấm" description="Không có đợt kiểm tra nào đang diễn ra" />
            )
          )}
        </>
      )}

      {tab === 'findings' && (
        <>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            Lỗi vi phạm tại nhà hàng ({findingsPage?.totalItems ?? 0})
          </div>
          {findingsPage?.items && findingsPage.items.length > 0 ? (
            findingsPage.items.map((f) => (
              <MobileFindingCard
                key={f.id}
                finding={f}
                canRespond={canRespond}
                canRemediate={canRemediate}
                onAction={onOpenAction}
              />
            ))
          ) : (
            !loadingFindings && (
              <ErrorBlock status="empty" title="Không có lỗi nào" description="Nhà hàng chưa ghi nhận lỗi vi phạm nào" />
            )
          )}
        </>
      )}

      <InspectionFormModal open={createModal} onClose={() => { setCreateModal(false); void refetchTasks() }} />
      <FindingActionModal
        open={actionState.open}
        action={actionState.action}
        finding={actionState.finding}
        onClose={() => { setActionState({ open: false }); void refetchFindings() }}
      />
    </Space>
  )
}
