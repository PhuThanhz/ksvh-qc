import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Modal, Select } from 'antd'
import { useCallback, useState } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { PlanDetailModal } from '@/features/inspections/components/PlanDetailModal'
import { PlanFormModal } from '@/features/inspections/components/PlanFormModal'
import { PlanTable } from '@/features/inspections/components/PlanTable'
import { usePlanActions, usePlans } from '@/features/inspections/hooks/useInspectionData'
import type { PlanResponse, PlanStatus } from '@/features/inspections/inspection.types'
import { useConfirm } from '@/hooks/useConfirm'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

interface Filters extends Record<string, unknown> {
  keyword?: string
  status?: PlanStatus
}

export function PlanListPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<Filters>()
  const plans = usePlans(params)
  const { submit, approve, reject, remove } = usePlanActions()
  const confirm = useConfirm()
  const notify = useNotify()

  const [modal, setModal] = useState<{ open: boolean; plan?: PlanResponse }>({ open: false })
  const [viewing, setViewing] = useState<PlanResponse>()
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; plan?: PlanResponse; reason: string }>({
    open: false,
    reason: '',
  })

  const onSearch = useCallback((kw: string) => setFilter('keyword', kw || undefined), [setFilter])

  const onSubmitPlan = useCallback(
    async (p: PlanResponse) => {
      const ok = await confirm({
        title: 'Gửi phê duyệt kế hoạch',
        content: `Gửi kế hoạch "${p.title}" (${p.planCode}) lên cấp trên phê duyệt?`,
        okText: 'Gửi duyệt',
      })
      if (!ok) return
      try {
        await submit.mutateAsync(p.id)
        notify.success('Đã gửi kế hoạch phê duyệt')
      } catch (err: unknown) {
        notify.error((err as { message?: string })?.message ?? 'Không thể gửi duyệt')
      }
    },
    [confirm, notify, submit],
  )

  const onApprovePlan = useCallback(
    async (p: PlanResponse) => {
      const ok = await confirm({
        title: 'Phê duyệt kế hoạch',
        content: `Phê duyệt kế hoạch "${p.title}" (${p.planCode})?`,
        okText: 'Phê duyệt',
      })
      if (!ok) return
      try {
        await approve.mutateAsync(p.id)
        notify.success('Đã phê duyệt kế hoạch')
      } catch (err: unknown) {
        notify.error((err as { message?: string })?.message ?? 'Không thể phê duyệt')
      }
    },
    [confirm, notify, approve],
  )

  const onConfirmReject = async () => {
    if (!rejectDialog.plan) return
    if (!rejectDialog.reason.trim()) {
      notify.error('Vui lòng nhập lý do từ chối')
      return
    }
    try {
      await reject.mutateAsync({ id: rejectDialog.plan.id, body: { reason: rejectDialog.reason.trim() } })
      notify.success('Đã từ chối kế hoạch')
      setRejectDialog({ open: false, reason: '' })
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Không thể từ chối kế hoạch')
    }
  }

  const onDeletePlan = useCallback(
    async (p: PlanResponse) => {
      const ok = await confirm({
        title: 'Xoá kế hoạch kiểm tra',
        content: `Xoá kế hoạch "${p.title}" (${p.planCode})? Hành động này không thể hoàn tác.`,
        okText: 'Xoá',
        danger: true,
      })
      if (!ok) return
      try {
        await remove.mutateAsync(p.id)
        notify.success('Đã xoá kế hoạch')
      } catch (err: unknown) {
        notify.error((err as { message?: string })?.message ?? 'Không thể xoá')
      }
    },
    [confirm, notify, remove],
  )

  return (
    <PageContainer
      title="Kế hoạch kiểm soát vận hành"
      subtitle="Lập kế hoạch, phân bổ lịch trình và phê duyệt đợt kiểm soát vận hành định kỳ và đột xuất"
      extra={
        <ProtectedAction access={PERMISSIONS.PLAN.CREATE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true })}>
            Thêm kế hoạch
          </Button>
        </ProtectedAction>
      }
    >
      <Flex vertical gap={16}>
        <AdvancedFilter
          search={{
            placeholder: 'Tìm theo mã hoặc tiêu đề kế hoạch...',
            value: filters.keyword,
            onSearch,
          }}
          activeCount={activeFilterCount}
          onReset={resetFilters}
        >
          <Select
            placeholder="Trạng thái"
            allowClear
            value={filters.status}
            onChange={(v) => setFilter('status', v)}
            style={{ width: 160 }}
            options={[
              { value: 'DRAFT', label: 'Bản nháp' },
              { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
              { value: 'APPROVED', label: 'Đã duyệt' },
              { value: 'REJECTED', label: 'Từ chối' },
            ]}
          />
        </AdvancedFilter>

        <PlanTable
          data={plans.data?.items}
          loading={plans.isLoading}
          currentPage={params.page}
          pageSize={params.size}
          totalItems={plans.data?.totalItems}
          onPageChange={(p, s) => onTableChange({ page: p - 1, size: s })}
          onView={setViewing}
          onEdit={(plan) => setModal({ open: true, plan })}
          onSubmit={onSubmitPlan}
          onApprove={onApprovePlan}
          onReject={(plan) => setRejectDialog({ open: true, plan, reason: '' })}
          onDelete={onDeletePlan}
        />
      </Flex>

      <PlanFormModal
        open={modal.open}
        plan={modal.plan}
        onClose={() => setModal({ open: false })}
      />

      <PlanDetailModal
        open={Boolean(viewing)}
        planId={viewing?.id}
        onClose={() => setViewing(undefined)}
      />

      <Modal
        open={rejectDialog.open}
        title="Từ chối kế hoạch kiểm tra"
        onCancel={() => setRejectDialog({ open: false, reason: '' })}
        onOk={onConfirmReject}
        confirmLoading={reject.isPending}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <p>Nhập lý do từ chối kế hoạch <b>{rejectDialog.plan?.planCode}</b>:</p>
          <Input.TextArea
            rows={3}
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Lý do từ chối..."
          />
        </div>
      </Modal>
    </PageContainer>
  )
}
