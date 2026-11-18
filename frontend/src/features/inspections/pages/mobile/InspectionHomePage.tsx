import { Button, ErrorBlock, PullToRefresh, Segmented, Space } from 'antd-mobile'
import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useSession } from '@/features/auth'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import { AckInspectionList } from '@/features/inspections/components/mobile/AckInspectionList'
import { MobileFindingCard } from '@/features/inspections/components/mobile/MobileFindingCard'
import { PendingReviewsCard } from '@/features/inspections/components/mobile/PendingReviewsCard'
import { InspectionTaskList } from '@/features/inspections/components/mobile/InspectionTaskList'
import { useFindings, useMyTasks, usePendingReviews } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { PERMISSIONS, usePermission } from '@/permissions'

const FindingActionModal = lazy(() =>
  import('@/features/inspections/components/FindingActionModal').then((m) => ({ default: m.FindingActionModal })),
)
const InspectionFormModal = lazy(() =>
  import('@/features/inspections/components/InspectionFormModal').then((m) => ({ default: m.InspectionFormModal })),
)

export function InspectionHomePage() {
  const { user } = useSession()
  const { allows } = usePermission()

  const canPerform = allows(PERMISSIONS.INSPECTION.PERFORM)
  const canRespond = allows(PERMISSIONS.FINDING.RESPOND)
  const canRemediate = allows(PERMISSIONS.FINDING.REMEDIATE)
  const canCreate = allows(PERMISSIONS.PLAN.CREATE)

  const isStore = user?.roles?.includes('STORE_MANAGER') ?? false
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab') as 'tasks' | 'findings' | null
  const tab: 'tasks' | 'findings' = (urlTab === 'tasks' || urlTab === 'findings')
    ? urlTab
    : (isStore && !canPerform ? 'findings' : 'tasks')

  const setTab = (newTab: 'tasks' | 'findings') => {
    setSearchParams(
      (prev) => {
        prev.set('tab', newTab)
        return prev
      },
      { replace: true },
    )
  }

  const [findingFilter, setFindingFilter] = useState<'urgent' | 'pending' | 'all'>('urgent')

  const { data: tasks, isLoading: loadingTasks, refetch: refetchTasks } = useMyTasks()
  const { data: findingsPage, isLoading: loadingFindings, refetch: refetchFindings } = useFindings({ page: 0, size: 50 })
  const { data: pendingReviews, refetch: refetchReviews } = usePendingReviews()

  const [createModal, setCreateModal] = useState(false)
  const [actionState, setActionState] = useState<{ open: boolean; action?: FindingActionType; finding?: FindingResponse }>({ open: false })

  const roleTitle = isStore ? 'Cửa hàng trưởng' : user?.roles?.includes('SYSTEM_ADMIN') ? 'Quản trị hệ thống' : 'Chuyên viên KSVH'

  const onOpenAction = (f: FindingResponse, a: FindingActionType) => {
    setActionState({ open: true, action: a, finding: f })
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        await Promise.all([refetchTasks(), refetchFindings(), refetchReviews()])
      }}
    >
      <Space direction="vertical" block style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>{roleTitle}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.fullName}</div>
          </div>
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

      <PendingReviewsCard pendingReviews={pendingReviews ?? []} onOpenAction={onOpenAction} />

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

          <InspectionTaskList tasks={tasks} loading={loadingTasks} />
        </>
      )}

      {tab === 'findings' && (() => {
        const allItems = findingsPage?.items ?? []
        const urgentItems = allItems.filter((f) => f.status === 'OPEN' || f.status === 'CONFIRMED' || f.status === 'REMEDIATING')
        const pendingItems = allItems.filter((f) => f.status === 'APPEALED' || f.status === 'APPEAL_MEETING' || f.status === 'PENDING_VERIFICATION')
        const displayed = findingFilter === 'urgent' ? urgentItems : findingFilter === 'pending' ? pendingItems : allItems

        return (
          <>
            {canRespond && <AckInspectionList />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Việc của tôi · Lỗi vi phạm</div>
            </div>
            <Segmented
              value={findingFilter}
              onChange={(v) => setFindingFilter(v as 'urgent' | 'pending' | 'all')}
              options={[
                { label: `Cần xử lý (${urgentItems.length})`, value: 'urgent' },
                { label: `Chờ kết quả (${pendingItems.length})`, value: 'pending' },
                { label: `Tất cả (${allItems.length})`, value: 'all' },
              ]}
            />
            {displayed.length > 0 ? (
              displayed.map((f) => (
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
                <ErrorBlock
                  status="empty"
                  style={{ '--image-height': '80px' }}
                  title="Không có lỗi nào"
                  description={
                    findingFilter === 'urgent'
                      ? 'Tuyệt vời! Nhà hàng không còn lỗi nào cần xử lý ngay.'
                      : 'Kéo xuống để làm mới danh sách'
                  }
                />
              )
            )}
          </>
        )
      })()}

      {createModal && (
        <Suspense fallback={null}>
          <InspectionFormModal open={createModal} onClose={() => { setCreateModal(false); void refetchTasks() }} />
        </Suspense>
      )}
      {actionState.open && actionState.action && actionState.finding && (
        <Suspense fallback={null}>
          <FindingActionModal
            open={actionState.open}
            action={actionState.action}
            finding={actionState.finding}
            onClose={() => { setActionState({ open: false }); void refetchFindings() }}
          />
        </Suspense>
      )}
    </Space>
  </PullToRefresh>
)
}
