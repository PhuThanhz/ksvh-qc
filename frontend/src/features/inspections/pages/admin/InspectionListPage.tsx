import { DownloadOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Space } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { CancelInspectionModal } from '@/features/inspections/components/CancelInspectionModal'
import { InspectionDetailModal } from '@/features/inspections/components/InspectionDetailModal'
import { InspectionFormModal } from '@/features/inspections/components/InspectionFormModal'
import { InspectionListFilterBar } from '@/features/inspections/components/InspectionListFilterBar'
import { InspectionTable } from '@/features/inspections/components/InspectionTable'
import { SurpriseSuggestionsModal } from '@/features/inspections/components/SurpriseSuggestionsModal'
import { useInspectionMutations, useInspections } from '@/features/inspections/hooks/useInspectionData'
import { useSurpriseSuggestions } from '@/features/inspections/hooks/useVerificationAndSurprise'
import {
  INSPECTION_KIND_LABEL,
  INSPECTION_MODE_LABEL,
  type InspectionCreateRequest,
  type InspectionStatus,
  type SurpriseInspectionSuggestion,
} from '@/features/inspections/inspection.types'
import { getComplianceGrade } from '@/features/inspections/utils/inspection-metrics'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { exportToCsv } from '@/utils/export-csv'
import { formatDate } from '@/utils/format-date'
import { INSPECTION_STATUS_TABS } from '@/features/inspections/constants/status'

interface Filters extends Record<string, unknown> {
  keyword?: string
  restaurantId?: number
  status?: InspectionStatus
}

export function InspectionListPage() {
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as InspectionStatus | null
  const initialFilters = useMemo(
    () => (statusParam ? { status: statusParam } : undefined),
    [statusParam],
  )

  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } =
    useListParams<Filters>(initialFilters)
  const inspections = useInspections(params)
  const suggestions = useSurpriseSuggestions()
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const { cancel } = useInspectionMutations()
  const notify = useNotify()

  const [createModal, setCreateModal] = useState(false)
  const [surpriseModal, setSurpriseModal] = useState(false)
  const [prefilledCreate, setPrefilledCreate] = useState<Partial<InspectionCreateRequest> | undefined>()
  const [detailModal, setDetailModal] = useState<{ open: boolean; id?: number }>({ open: false })
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id?: number; reason: string }>({
    open: false,
    reason: '',
  })

  const onSearch = useCallback((kw: string) => setFilter('keyword', kw || undefined), [setFilter])

  const onConfirmCancel = async () => {
    if (!cancelDialog.id) return
    if (!cancelDialog.reason.trim()) {
      notify.error('Vui lòng nhập lý do huỷ đợt kiểm tra')
      return
    }
    try {
      await cancel.mutateAsync({ id: cancelDialog.id, body: { reason: cancelDialog.reason.trim() } })
      notify.success('Đã huỷ đợt kiểm tra')
      setCancelDialog({ open: false, reason: '' })
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Không thể huỷ đợt kiểm tra')
    }
  }

  const onExportInspections = () => {
    const list = inspections.data?.items ?? []
    if (list.length === 0) return
    exportToCsv(
      `danh-sach-bien-ban-kiem-tra-${dayjs().format('YYYYMMDD')}`,
      [
        { header: 'Mã biên bản', accessor: (i) => i.code },
        { header: 'Cơ sở', accessor: (i) => i.restaurantName },
        { header: 'Mẫu / Chuyên đề', accessor: (i) => i.templateName ?? (i.topicNames.join(', ') || 'Chuyên đề') },
        { header: 'Loại', accessor: (i) => INSPECTION_KIND_LABEL[i.inspectionType] },
        { header: 'Hình thức', accessor: (i) => INSPECTION_MODE_LABEL[i.inspectionMode] },
        { header: 'Chuyên viên', accessor: (i) => i.inspectorName },
        { header: 'Điểm tuân thủ (%)', accessor: (i) => i.complianceScore ?? '' },
        { header: 'Xếp loại', accessor: (i) => getComplianceGrade(i.complianceScore, i.maxRiskLevel).label },
        { header: 'Điểm rủi ro', accessor: (i) => i.totalRiskScore },
        { header: 'Mức rủi ro cao nhất', accessor: (i) => i.maxRiskLevel ?? '' },
        { header: 'Trạng thái', accessor: (i) => i.status },
        { header: 'Ngày tạo', accessor: (i) => formatDate(i.createdAt) },
      ],
      list,
    )
  }

  const activeTab = (filters.status as string) || 'ALL'
  const canCreateRule = { anyOf: [PERMISSIONS.PLAN.CREATE, PERMISSIONS.INSPECTION.PERFORM] }

  return (
    <PageContainer
      title="Biên bản kiểm tra KSVH"
      subtitle="Quản lý và giám sát quá trình thực hiện đánh giá kiểm soát vận hành tại các cơ sở"
      extra={
        <Space size={8}>
          <Button icon={<DownloadOutlined />} onClick={onExportInspections} disabled={!inspections.data?.items?.length}>
            Xuất CSV
          </Button>
          <ProtectedAction access={canCreateRule}>
            <Button icon={<ThunderboltOutlined />} onClick={() => setSurpriseModal(true)}>
              <Badge count={suggestions.data?.length ?? 0} offset={[8, -2]} size="small">
                Gợi ý đột xuất
              </Badge>
            </Button>
          </ProtectedAction>
          <ProtectedAction access={canCreateRule}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setPrefilledCreate(undefined)
                setCreateModal(true)
              }}
            >
              Tạo đợt kiểm tra
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <Flex vertical gap={16}>
        <InspectionListFilterBar
          keyword={filters.keyword}
          restaurantId={filters.restaurantId}
          status={filters.status}
          activeFilterCount={activeFilterCount}
          restaurants={restaurants.data?.items ?? []}
          onSearch={onSearch}
          onFilterStatus={(val) => setFilter('status', val)}
          onFilterRestaurant={(val) => setFilter('restaurantId', val)}
          onReset={resetFilters}
        />

        <ViewTabs
          items={INSPECTION_STATUS_TABS.map((t) => ({ key: t.value, label: t.label }))}
          activeKey={activeTab}
          onChange={(val) => setFilter('status', val === 'ALL' ? undefined : (val as InspectionStatus))}
        />
        <InspectionTable
          data={inspections.data?.items}
          loading={inspections.isLoading}
          currentPage={params.page}
          pageSize={params.size}
          totalItems={inspections.data?.totalItems}
          onPageChange={(p, s) => onTableChange({ page: p - 1, size: s })}
          onView={(ins) => setDetailModal({ open: true, id: ins.id })}
          onCancel={(ins) => setCancelDialog({ open: true, id: ins.id, reason: '' })}
        />
      </Flex>

      <InspectionFormModal
        open={createModal}
        initialValues={prefilledCreate}
        onClose={() => { setCreateModal(false); setPrefilledCreate(undefined); inspections.refetch() }}
      />

      <SurpriseSuggestionsModal
        open={surpriseModal}
        onClose={() => setSurpriseModal(false)}
        onCreateSurprise={(suggestion: SurpriseInspectionSuggestion) => {
          setPrefilledCreate({
            inspectionType: 'SURPRISE',
            restaurantId: suggestion.restaurantId,
            topicGroupIds: suggestion.suggestedTopicGroupIds,
            notes: `Kiểm tra đột xuất theo đề xuất: ${suggestion.primaryReason}`,
          })
          setCreateModal(true)
        }}
      />

      <InspectionDetailModal
        open={detailModal.open}
        inspectionId={detailModal.id}
        onClose={() => setDetailModal({ open: false })}
      />

      <CancelInspectionModal
        open={cancelDialog.open}
        reason={cancelDialog.reason}
        loading={cancel.isPending}
        onChangeReason={(val) => setCancelDialog((prev) => ({ ...prev, reason: val }))}
        onConfirm={onConfirmCancel}
        onCancel={() => setCancelDialog({ open: false, reason: '' })}
      />
    </PageContainer>
  )
}
