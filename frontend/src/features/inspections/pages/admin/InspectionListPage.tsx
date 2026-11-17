import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Input, Modal, Segmented, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { InspectionDetailModal } from '@/features/inspections/components/InspectionDetailModal'
import { InspectionFormModal } from '@/features/inspections/components/InspectionFormModal'
import { InspectionTable } from '@/features/inspections/components/InspectionTable'
import { useInspectionMutations, useInspections } from '@/features/inspections/hooks/useInspectionData'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionStatus } from '@/features/inspections/inspection.types'
import { getComplianceGrade } from '@/features/inspections/utils/inspection-metrics'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { exportToCsv } from '@/utils/export-csv'
import { formatDate } from '@/utils/format-date'

interface Filters extends Record<string, unknown> {
  keyword?: string
  restaurantId?: number
  status?: InspectionStatus
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ASSIGNED', label: 'Đã phân công' },
  { value: 'IN_PROGRESS', label: 'Đang chấm' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

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
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const { cancel } = useInspectionMutations()
  const notify = useNotify()

  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState<{ open: boolean; id?: number }>({ open: false })
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id?: number; reason: string }>({
    open: false,
    reason: '',
  })

  const onSearch = useCallback((kw: string) => setFilter('keyword', kw || undefined), [setFilter])

  const onConfirmCancel = async () => {
    if (!cancelDialog.id) return
    if (!cancelDialog.reason.trim()) {
      notify.error('Vui lòng nhập lý do huỷ phiếu')
      return
    }
    try {
      await cancel.mutateAsync({ id: cancelDialog.id, body: { reason: cancelDialog.reason.trim() } })
      notify.success('Đã huỷ phiếu chấm')
      setCancelDialog({ open: false, reason: '' })
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Không thể huỷ phiếu')
    }
  }

  const onExportInspections = () => {
    const list = inspections.data?.items ?? []
    if (list.length === 0) return
    exportToCsv(
      `danh-sach-phieu-cham-${dayjs().format('YYYYMMDD')}`,
      [
        { header: 'Mã phiếu', accessor: (i) => i.code },
        { header: 'Nhà hàng', accessor: (i) => i.restaurantName },
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

  return (
    <PageContainer
      title="Phiếu chấm kiểm soát"
      subtitle="Quản lý và theo dõi quá trình thực hiện chấm điểm vận hành tại các nhà hàng"
      extra={
        <Space size={8}>
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportInspections}
            disabled={!inspections.data?.items?.length}
          >
            Xuất CSV
          </Button>
          <ProtectedAction access={{ anyOf: [PERMISSIONS.PLAN.CREATE, PERMISSIONS.INSPECTION.PERFORM] }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
              Tạo đợt kiểm tra
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Flex vertical gap={16}>
          {/* Thanh chuyển tab trạng thái nhanh (1-click lọc) */}
          <Segmented
            options={STATUS_TABS}
            value={activeTab}
            onChange={(val) => setFilter('status', val === 'ALL' ? undefined : (val as InspectionStatus))}
            style={{ width: 'fit-content', background: '#f1f5f9', padding: 3, borderRadius: 8 }}
          />

          <AdvancedFilter
            search={{
              placeholder: 'Tìm theo mã phiếu, loại kiểm tra...',
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
              style={{ width: 220 }}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={restaurants.data?.items.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
            />

            <Select
              placeholder="Trạng thái"
              allowClear
              value={filters.status}
              onChange={(v) => setFilter('status', v)}
              style={{ width: 160 }}
              options={[
                { value: 'ASSIGNED', label: 'Đã phân công' },
                { value: 'IN_PROGRESS', label: 'Đang chấm' },
                { value: 'SUBMITTED', label: 'Đã nộp' },
                { value: 'COMPLETED', label: 'Hoàn thành' },
                { value: 'CANCELLED', label: 'Đã huỷ' },
              ]}
            />
          </AdvancedFilter>

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
      </Card>

      <InspectionFormModal
        open={createModal}
        onClose={() => {
          setCreateModal(false)
          inspections.refetch()
        }}
      />

      <InspectionDetailModal
        open={detailModal.open}
        inspectionId={detailModal.id}
        onClose={() => setDetailModal({ open: false })}
      />

      <Modal
        title="Xác nhận huỷ phiếu kiểm tra"
        open={cancelDialog.open}
        onCancel={() => setCancelDialog({ open: false, reason: '' })}
        onOk={onConfirmCancel}
        okText="Huỷ phiếu"
        okButtonProps={{ danger: true, loading: cancel.isPending }}
        centered
      >
        <p style={{ marginTop: 12 }}>
          Bạn có chắc chắn muốn huỷ phiếu kiểm tra này? Thao tác này sẽ huỷ bỏ toàn bộ các mục chấm điểm và lỗi liên quan.
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Nhập lý do huỷ phiếu bắt buộc..."
          value={cancelDialog.reason}
          onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
        />
      </Modal>
    </PageContainer>
  )
}
