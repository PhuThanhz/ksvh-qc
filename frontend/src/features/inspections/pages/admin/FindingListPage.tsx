import { DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Segmented, Select } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { FindingActionModal, type FindingActionType } from '@/features/inspections/components/FindingActionModal'
import { FindingDetailModal } from '@/features/inspections/components/FindingDetailModal'
import { FindingTable } from '@/features/inspections/components/FindingTable'
import { useFindings } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useListParams } from '@/hooks/useListParams'
import { exportToCsv } from '@/utils/export-csv'
import { formatDate } from '@/utils/format-date'

interface Filters extends Record<string, unknown> {
  keyword?: string
  restaurantId?: number
  status?: FindingStatus
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Chờ phản hồi' },
  { value: 'APPEALED', label: 'Đang khiếu nại' },
  { value: 'REMEDIATING', label: 'Đang khắc phục' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ nghiệm thu' },
  { value: 'CLOSED', label: 'Đã đóng' },
]

export function FindingListPage() {
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as FindingStatus | null
  const initialFilters = useMemo(
    () => (statusParam ? { status: statusParam } : undefined),
    [statusParam],
  )

  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } =
    useListParams<Filters>(initialFilters)
  const findings = useFindings(params)
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })

  const [selectedFindingId, setSelectedFindingId] = useState<number | undefined>()
  const [actionState, setActionState] = useState<{
    open: boolean
    action?: FindingActionType
    finding?: FindingResponse
  }>({ open: false })

  const onSearch = useCallback((kw: string) => setFilter('keyword', kw || undefined), [setFilter])

  const onTriggerAction = useCallback((finding: FindingResponse, action: FindingActionType) => {
    setActionState({ open: true, action, finding })
  }, [])

  const onViewDetail = useCallback((finding: FindingResponse) => {
    setSelectedFindingId(finding.id)
  }, [])

  const onExportFindings = () => {
    const list = findings.data?.items ?? []
    if (list.length === 0) return
    exportToCsv(
      `danh-sach-loi-khac-phuc-${dayjs().format('YYYYMMDD')}`,
      [
        { header: 'Mã lỗi', accessor: (f) => `#${f.id}` },
        { header: 'Mã phiếu', accessor: (f) => f.inspectionCode },
        { header: 'Nhà hàng', accessor: (f) => f.restaurantName },
        { header: 'Mã tiêu chí', accessor: (f) => f.criterionCode },
        { header: 'Tiêu chí', accessor: (f) => f.criterionName },
        { header: 'Trọng số gốc', accessor: (f) => f.baseImpact },
        { header: 'Ảnh hưởng hiệu lực', accessor: (f) => f.effectiveImpact },
        { header: 'Lần vi phạm', accessor: (f) => f.violationCount },
        { header: 'Điểm rủi ro', accessor: (f) => f.calculatedScore },
        { header: 'Mức rủi ro', accessor: (f) => f.riskLevelCode },
        { header: 'Trạng thái', accessor: (f) => f.status },
        { header: 'Hạn khắc phục', accessor: (f) => formatDate(f.deadlineDate) },
        { header: 'Hẹn hoàn thành', accessor: (f) => formatDate(f.remediationTargetDate) },
      ],
      list,
    )
  }

  const activeTab = (filters.status as string) || 'ALL'

  return (
    <PageContainer
      title="Quản lý lỗi & Khắc phục"
      subtitle="Theo dõi chu trình xử lý lỗi vi phạm từ xác nhận, khiếu nại, khắc phục đến nghiệm thu đóng lỗi"
      extra={
        <Button
          icon={<DownloadOutlined />}
          onClick={onExportFindings}
          disabled={!findings.data?.items?.length}
        >
          Xuất CSV
        </Button>
      }
    >
      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Flex vertical gap={16}>
          {/* Thanh chuyển tab trạng thái nhanh (1-click lọc) */}
          <Segmented
            options={STATUS_TABS}
            value={activeTab}
            onChange={(val) => setFilter('status', val === 'ALL' ? undefined : (val as FindingStatus))}
            style={{ width: 'fit-content', background: '#f1f5f9', padding: 3, borderRadius: 8 }}
          />

          <AdvancedFilter
            search={{
              placeholder: 'Tìm kiếm mô tả lỗi, khiếu nại, khắc phục...',
              value: filters.keyword,
              onSearch,
            }}
            activeCount={activeFilterCount}
            onReset={resetFilters}
          >
            <Select
              placeholder="Nhà hàng"
              allowClear
              showSearch
              value={filters.restaurantId}
              onChange={(v) => setFilter('restaurantId', v)}
              style={{ width: 240 }}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={restaurants.data?.items.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
            />

            <Select
              placeholder="Trạng thái chi tiết"
              allowClear
              value={filters.status}
              onChange={(v) => setFilter('status', v)}
              style={{ width: 190 }}
              options={[
                { value: 'OPEN', label: 'Chờ phản hồi' },
                { value: 'CONFIRMED', label: 'Đã xác nhận' },
                { value: 'APPEALED', label: 'Đang khiếu nại' },
                { value: 'REMEDIATING', label: 'Đang khắc phục' },
                { value: 'PENDING_VERIFICATION', label: 'Chờ nghiệm thu' },
                { value: 'CLOSED', label: 'Đã đóng (Đạt)' },
                { value: 'DISMISSED', label: 'Đã huỷ bỏ' },
              ]}
            />
          </AdvancedFilter>

          <FindingTable
            data={findings.data?.items}
            loading={findings.isLoading}
            currentPage={params.page}
            pageSize={params.size}
            totalItems={findings.data?.totalItems}
            onPageChange={(p, s) => onTableChange({ page: p - 1, size: s })}
            onAction={onTriggerAction}
            onView={onViewDetail}
          />
        </Flex>
      </Card>

      <FindingActionModal
        open={actionState.open}
        action={actionState.action}
        finding={actionState.finding}
        onClose={() => setActionState({ open: false })}
      />

      <FindingDetailModal
        open={!!selectedFindingId}
        findingId={selectedFindingId}
        onClose={() => setSelectedFindingId(undefined)}
      />
    </PageContainer>
  )
}
