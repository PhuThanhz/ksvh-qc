import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Input, Modal, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
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

export function InspectionListPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<Filters>()
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
      <Card>
        <Flex vertical gap={16}>
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

      <InspectionFormModal open={createModal} onClose={() => setCreateModal(false)} />

      <InspectionDetailModal
        open={detailModal.open}
        inspectionId={detailModal.id}
        onClose={() => setDetailModal({ open: false })}
      />

      <Modal
        open={cancelDialog.open}
        title="Huỷ phiếu chấm kiểm soát"
        onCancel={() => setCancelDialog({ open: false, reason: '' })}
        onOk={onConfirmCancel}
        confirmLoading={cancel.isPending}
        okText="Huỷ phiếu"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <p>Vui lòng nhập lý do huỷ phiếu:</p>
          <Input.TextArea
            rows={3}
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Lý do huỷ..."
          />
        </div>
      </Modal>
    </PageContainer>
  )
}
