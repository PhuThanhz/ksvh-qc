import { Alert, Form, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { plansApi } from '@/features/inspections/api/inspection.api'
import { usePlans } from '@/features/inspections/hooks/useInspectionData'
import type { PlanAssignmentRequest } from '@/features/inspections/inspection.types'
import { useNotify } from '@/hooks/useNotify'

interface Props {
  open: boolean
  currentPlanId?: number
  defaultDate?: string
  onClose: () => void
  onCopy: (assignments: PlanAssignmentRequest[]) => void
}

export function PlanCopyModal({ open, currentPlanId, defaultDate, onClose, onCopy }: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const notify = useNotify()
  const { data: plansData, isLoading: loadingPlans } = usePlans({ size: 50 })

  const availablePlans = (plansData?.items ?? []).filter((p) => p.id !== currentPlanId)

  const handleCopy = async () => {
    if (!selectedPlanId) return
    setLoading(true)
    try {
      const items = await plansApi.copyableAssignments(selectedPlanId)
      if (!items || items.length === 0) {
        notify.warning('Kế hoạch được chọn không có phân công nào để sao chép')
        return
      }
      const mapped: PlanAssignmentRequest[] = items.map((a) => ({
        restaurantId: a.restaurantId,
        inspectorId: a.inspectorId,
        templateId: a.templateId,
        scheduledDate: defaultDate || dayjs().format('YYYY-MM-DD'),
      }))
      onCopy(mapped)
      notify.success(`Đã sao chép ${mapped.length} phân công từ kế hoạch đã chọn`)
      onClose()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Không thể sao chép phân công')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Sao chép phân công từ kế hoạch khác"
      onCancel={onClose}
      onOk={handleCopy}
      confirmLoading={loading}
      okButtonProps={{ disabled: !selectedPlanId }}
      okText="Sao chép phân công"
      width={520}
      destroyOnHidden
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="info"
          showIcon
          message="Giúp lập kế hoạch nhanh"
          description="Hệ thống sẽ lấy danh sách nhà hàng, chuyên viên và mẫu phiếu từ kế hoạch đã chọn. Ngày kiểm tra sẽ được đặt mặc định theo ngày đầu của kế hoạch hiện tại."
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical">
          <Form.Item label="Chọn kế hoạch mẫu nguồn" required>
            <Select
              placeholder="Chọn kế hoạch nguồn..."
              loading={loadingPlans}
              value={selectedPlanId}
              onChange={setSelectedPlanId}
              options={availablePlans.map((p) => ({
                value: p.id,
                label: `${p.planCode} - ${p.title} (${p.assignments?.length || 0} nhà hàng)`,
              }))}
              showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
