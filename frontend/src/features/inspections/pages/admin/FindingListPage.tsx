import { DownloadOutlined } from '@ant-design/icons'
import { Button, Flex } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { FindingActionModal, type FindingActionType } from '@/features/inspections/components/FindingActionModal'
import {
  FindingBatchActionModal,
  type BatchActionType,
} from '@/features/inspections/components/FindingBatchActionModal'
import { FindingBatchToolbar } from '@/features/inspections/components/FindingBatchToolbar'
import { FindingDetailModal } from '@/features/inspections/components/FindingDetailModal'
import { FindingListFilterBar } from '@/features/inspections/components/FindingListFilterBar'
import { FindingTable } from '@/features/inspections/components/FindingTable'
import { useFindings, usePendingReviews } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { exportFindingsToCsv } from '@/features/inspections/utils/finding-export'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useListParams } from '@/hooks/useListParams'
import { PERMISSIONS, usePermission } from '@/permissions'

interface Filters extends Record<string, unknown> {
  keyword?: string
  restaurantId?: number
  status?: FindingStatus | 'PENDING_REVIEW'
}

export function FindingListPage() {
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as FindingStatus | null
  const initialFilters = useMemo(() => (statusParam ? { status: statusParam } : undefined), [statusParam])

  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } =
    useListParams<Filters>(initialFilters)

  const isPendingReviewTab = filters.status === 'PENDING_REVIEW'
  const queryParams = useMemo(
    () => ({ ...params, status: isPendingReviewTab ? undefined : (params.status as FindingStatus) }),
    [params, isPendingReviewTab],
  )
  const findings = useFindings(queryParams)
  const pendingReviews = usePendingReviews()
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })

  const { can } = usePermission()
  const canRespond = can(PERMISSIONS.FINDING.RESPOND)
  const canRemediate = can(PERMISSIONS.FINDING.REMEDIATE)
  const canVerify = can(PERMISSIONS.FINDING.VERIFY)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedFindingId, setSelectedFindingId] = useState<number | undefined>()
  const [batchAction, setBatchAction] = useState<BatchActionType | undefined>()
  const [actionState, setActionState] = useState<{
    open: boolean
    action?: FindingActionType
    finding?: FindingResponse
  }>({ open: false })

  const currentList = isPendingReviewTab ? pendingReviews.data : findings.data?.items
  const selectedFindings = useMemo(() => {
    const keySet = new Set(selectedRowKeys)
    return (currentList ?? []).filter((f) => keySet.has(f.id))
  }, [currentList, selectedRowKeys])

  const canBatchConfirm =
    canRespond && selectedFindings.length > 0 && selectedFindings.every((f) => f.status === 'OPEN')
  const canBatchPlan =
    canRemediate &&
    selectedFindings.length > 0 &&
    selectedFindings.every((f) => f.status === 'OPEN' || f.status === 'CONFIRMED')
  const canBatchVerify =
    canVerify &&
    selectedFindings.length > 0 &&
    selectedFindings.every((f) => f.status === 'PENDING_VERIFICATION')

  const onSearch = useCallback((kw: string) => setFilter('keyword', kw || undefined), [setFilter])
  const onFilterTab = useCallback(
    (tab: string) => {
      setSelectedRowKeys([])
      setFilter('status', tab === 'ALL' ? undefined : (tab as FindingStatus))
    },
    [setFilter],
  )

  const onTriggerAction = useCallback((finding: FindingResponse, action: FindingActionType) => {
    setActionState({ open: true, action, finding })
  }, [])

  return (
    <PageContainer
      title="Quản lý lỗi & Khắc phục"
      subtitle="Theo dõi chu trình xử lý lỗi vi phạm từ xác nhận, khiếu nại, khắc phục đến nghiệm thu đóng lỗi"
      extra={
        <Button
          icon={<DownloadOutlined />}
          onClick={() => exportFindingsToCsv(findings.data?.items ?? [])}
          disabled={!findings.data?.items?.length}
        >
          Xuất CSV
        </Button>
      }
    >
      <Flex vertical gap={16}>
        <FindingListFilterBar
          activeTab={(filters.status as string) || 'ALL'}
          pendingCount={pendingReviews.data?.length}
          keyword={filters.keyword}
          restaurantId={filters.restaurantId}
          status={filters.status as FindingStatus}
          activeFilterCount={activeFilterCount}
          restaurants={restaurants.data?.items ?? []}
          onSearch={onSearch}
          onFilterTab={onFilterTab}
          onFilterStatus={(v) => setFilter('status', v)}
          onFilterRestaurant={(v) => setFilter('restaurantId', v)}
          onReset={resetFilters}
        />

        <FindingBatchToolbar
          selectedCount={selectedFindings.length}
          canConfirm={canBatchConfirm}
          canPlan={canBatchPlan}
          canVerify={canBatchVerify}
          onConfirm={() => setBatchAction('CONFIRM')}
          onPlan={() => setBatchAction('PLAN')}
          onVerify={() => setBatchAction('VERIFY')}
          onClear={() => setSelectedRowKeys([])}
        />

        <FindingTable
          data={currentList}
          loading={isPendingReviewTab ? pendingReviews.isLoading : findings.isLoading}
          currentPage={isPendingReviewTab ? 0 : params.page}
          pageSize={isPendingReviewTab ? (pendingReviews.data?.length || 20) : params.size}
          totalItems={isPendingReviewTab ? pendingReviews.data?.length : findings.data?.totalItems}
          selectedRowKeys={selectedRowKeys}
          onSelectRowKeys={setSelectedRowKeys}
          onPageChange={(p, s) => onTableChange({ page: p - 1, size: s })}
          onAction={onTriggerAction}
          onView={(f) => setSelectedFindingId(f.id)}
        />
      </Flex>

      <FindingActionModal
        open={actionState.open}
        action={actionState.action}
        finding={actionState.finding}
        onClose={() => setActionState({ open: false })}
      />

      <FindingBatchActionModal
        open={Boolean(batchAction)}
        actionType={batchAction}
        findings={selectedFindings}
        onClose={() => setBatchAction(undefined)}
        onSuccess={() => setSelectedRowKeys([])}
      />

      <FindingDetailModal
        open={Boolean(selectedFindingId)}
        findingId={selectedFindingId}
        onClose={() => setSelectedFindingId(undefined)}
      />
    </PageContainer>
  )
}
