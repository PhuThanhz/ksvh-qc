import { CalendarOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, Segmented, Spin } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailDrawer } from '@/components/feedback/detail'
import { PlanAssignmentEditor } from '@/features/inspections/components/PlanAssignmentEditor'
import { PlanCopyModal } from '@/features/inspections/components/PlanCopyModal'
import { PlanInspectorPanel } from '@/features/inspections/components/PlanInspectorPanel'
import { usePlan, useSavePlan } from '@/features/inspections/hooks/useInspectionData'
import { useInspectorConflicts } from '@/features/inspections/hooks/useInspectorConflicts'
import type { PlanAssignmentRequest, PlanResponse } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useNotify } from '@/hooks/useNotify'

interface Props {
  open: boolean
  plan?: PlanResponse
  onClose: () => void
}

type PlanKind = 'PERIODIC' | 'SURPRISE'

interface FormValues {
  inspectionKind: PlanKind
  title: string
  /** Hạn hoàn thành: mọi phiếu chấm phải xong trước ngày này (không còn ngày bắt đầu / ngày kiểm tra từng nhà hàng). */
  deadline: dayjs.Dayjs
  notes?: string
  assignments: PlanAssignmentRequest[]
}

const KIND_HINT: Record<PlanKind, string> = {
  PERIODIC: 'Mỗi nhà hàng chọn một mẫu phiếu; duyệt xong tự sinh phiếu chấm đủ tiêu chí của mẫu (mã PER-…).',
  SURPRISE: 'Mỗi nhà hàng chọn chuyên đề cần soi (nhóm tiêu chí); duyệt xong tự sinh phiếu đột xuất (mã DX-…).',
}
const defaultTitle = (kind: PlanKind, month: dayjs.Dayjs) =>
  `${kind === 'SURPRISE' ? 'Kiểm tra đột xuất' : 'Kiểm tra định kỳ'} tháng ${month.format('MM/YYYY')}`

/** Hạn mặc định: cuối tháng sau. */
const defaultDeadline = () => dayjs().add(1, 'month').endOf('month')

/** Lập / sửa kế hoạch kiểm tra tháng trong drawer toàn màn hình: thông tin chung, đội chuyên viên, bảng phân công. */
export function PlanFormModal({ open, plan, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [copyOpen, setCopyOpen] = useState(false)
  const [inspectorId, setInspectorId] = useState<number>()
  /** Nhà hàng đang tick trong bảng phân công (chờ giao chuyên viên). */
  const [selectedRestaurants, setSelectedRestaurants] = useState<number[]>([])
  const save = useSavePlan()
  const notify = useNotify()
  const isEdit = !!plan
  const planDetail = usePlan(open && plan ? plan.id : undefined)
  const deadline = Form.useWatch('deadline', form)
  /** Khoảng từ hôm nay tới hạn: để đếm lịch của chuyên viên ở kế hoạch khác. */
  const period = useMemo<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => (deadline ? [dayjs().startOf('day'), deadline] : null), [deadline])
  const assignments: PlanAssignmentRequest[] = Form.useWatch('assignments', form) ?? []
  const kind: PlanKind = Form.useWatch('inspectionKind', form) ?? 'PERIODIC'
  const surprise = kind === 'SURPRISE'
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const restaurantName = useCallback(
    (id: number) => restaurants.data?.items.find((r) => r.id === id)?.name,
    [restaurants.data],
  )
  const conflicts = useInspectorConflicts(assignments, period, plan?.id, restaurantName)

  /**
   * Bấm chuyên viên ở cột trái: giao các nhà hàng đang tick cho người đó (rồi bỏ tick);
   * không tick dòng nào thì giao các nhà hàng chưa có người phụ trách.
   */
  const selectInspector = (id: number | undefined) => {
    setInspectorId(id)
    if (!id) return
    const picked = new Set(selectedRestaurants)
    const target = (a: PlanAssignmentRequest) => (picked.size > 0 ? picked.has(a.restaurantId) : !a.inspectorId)
    if (assignments.some(target)) {
      form.setFieldValue('assignments', assignments.map((a) => (target(a) ? { ...a, inspectorId: id } : a)))
    }
    setSelectedRestaurants([])
  }

  useEffect(() => {
    if (!open) return
    if (plan) {
      const p = planDetail.data ?? plan
      form.setFieldsValue({
        inspectionKind: p.inspectionKind === 'SURPRISE' ? 'SURPRISE' : 'PERIODIC',
        title: p.title,
        deadline: dayjs(p.endDate),
        notes: p.notes,
        assignments: (p.assignments ?? []).map((a) => ({
          restaurantId: a.restaurantId, inspectorId: a.inspectorId, templateId: a.templateId ?? null,
          topicGroupIds: a.topicGroupIds ?? [], criterionIds: a.criterionIds ?? [], scheduledDate: a.scheduledDate ?? null,
        })),
      })
    } else {
      const next = defaultDeadline()
      form.resetFields()
      form.setFieldsValue({
        inspectionKind: 'PERIODIC',
        title: defaultTitle('PERIODIC', next),
        deadline: next,
        assignments: [],
      })
    }
  }, [open, plan, planDetail.data, form])

  const missingScope = (a: PlanAssignmentRequest) => (surprise ? (!a.templateId && !a.topicGroupIds?.length) : !a.templateId)
  const incomplete = assignments.filter((a) => !a.inspectorId || missingScope(a)).length
  const inspectorCount = new Set(assignments.map((a) => a.inspectorId).filter(Boolean)).size

  const onSubmit = async () => {
    let vals: FormValues
    try {
      vals = await form.validateFields()
    } catch {
      return
    }
    const list = vals.assignments ?? []
    const bad = list.findIndex((a) => !a.restaurantId || !a.inspectorId || missingScope(a))
    if (bad >= 0) return notify.error(`Dòng #${bad + 1} chưa đủ chuyên viên hoặc ${surprise ? 'phạm vi (mẫu đột xuất / chuyên đề)' : 'mẫu phiếu'}`)
    if (new Set(list.map((a) => a.restaurantId)).size !== list.length) {
      return notify.error('Có nhà hàng bị phân công trùng trong kế hoạch')
    }

    const body = {
      title: vals.title,
      // Chỉ gửi hạn hoàn thành; ngày bắt đầu do server đặt (ngày tạo kế hoạch)
      endDate: vals.deadline.format('YYYY-MM-DD'),
      notes: vals.notes,
      assignments: list.map((a) => (surprise ? { ...a, templateId: null } : { ...a, topicGroupIds: [], criterionIds: [] })),
    }
    try {
      if (isEdit) await save.mutateAsync({ id: plan.id, body })
      else await save.mutateAsync({ body: { ...body, planCode: null, inspectionKind: kind } })
      notify.success(isEdit ? 'Đã cập nhật kế hoạch' : 'Đã tạo kế hoạch kiểm tra')
      onClose()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi')
    }
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      afterClose={() => { setInspectorId(undefined); setSelectedRestaurants([]) }}
      maskClosable={false}
      closeText="Huỷ"
      icon={<CalendarOutlined />}
      title={isEdit ? `Chỉnh sửa kế hoạch ${plan.planCode}` : 'Lập kế hoạch kiểm tra'}
      subtitle={KIND_HINT[kind]}
      footerNote={
        <span className="plan-summary">
          <b>{assignments.length}</b> nhà hàng · <b>{inspectorCount}</b> chuyên viên
          {incomplete > 0 && <span className="plan-summary__warn"> · {incomplete} dòng chưa đủ thông tin</span>}
        </span>
      }
      actions={<Button type="primary" loading={save.isPending} onClick={() => void onSubmit()}>{isEdit ? 'Lưu thay đổi' : 'Lưu kế hoạch'}</Button>}
    >
      <Spin spinning={isEdit && planDetail.isLoading}>
        <Form form={form} layout="vertical">
          <div className="plan-info">
            <Form.Item name="inspectionKind" label="Loại kiểm tra" className="plan-info__kind" required
              extra={isEdit ? 'Không đổi được loại sau khi tạo kế hoạch.' : undefined}>
              <Segmented<PlanKind>
                block
                disabled={isEdit}
                options={[{ label: 'Định kỳ', value: 'PERIODIC' }, { label: 'Đột xuất', value: 'SURPRISE' }]}
                onChange={(next) => {
                  const month = (form.getFieldValue('deadline') as dayjs.Dayjs | undefined) ?? dayjs()
                  if (form.getFieldValue('title') === defaultTitle(kind, month)) form.setFieldValue('title', defaultTitle(next, month))
                }}
              />
            </Form.Item>
            <Form.Item name="title" label="Tiêu đề kế hoạch" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
              <Input placeholder="VD: Kiểm tra định kỳ tháng 12/2026" />
            </Form.Item>
            <Form.Item
              name="deadline"
              label="Hạn hoàn thành"
              tooltip="Mọi nhà hàng trong kế hoạch phải được kiểm tra xong trước ngày này; chuyên viên tự sắp lịch đi."
              rules={[{ required: true, message: 'Vui lòng chọn hạn hoàn thành' }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày phải hoàn thành"
                style={{ width: '100%' }}
                disabledDate={(d) => d.isBefore(dayjs(), 'day')}
                presets={[
                  { label: 'Cuối tháng này', value: dayjs().endOf('month') },
                  { label: 'Cuối tháng sau', value: dayjs().add(1, 'month').endOf('month') },
                ]}
              />
            </Form.Item>
            <Form.Item name="notes" label="Mục tiêu / ghi chú" className="plan-info__notes">
              <Input placeholder="VD: Tập trung nhóm VSATTP sau đợt lỗi tháng trước" />
            </Form.Item>
          </div>
          <div className="plan-layout">
            <PlanInspectorPanel
              assignments={assignments}
              selectedId={inspectorId}
              onSelect={selectInspector}
              conflictDays={conflicts.conflictDays}
              otherLoad={conflicts.otherLoad}
            />
            <Form.Item name="assignments" noStyle>
              <PlanAssignmentEditor
                kind={kind}
                inspectorId={inspectorId}
                selectedRestaurantIds={selectedRestaurants}
                onSelectRestaurants={setSelectedRestaurants}
                onOpenCopy={() => setCopyOpen(true)}
              />
            </Form.Item>
          </div>
        </Form>
      </Spin>
      <PlanCopyModal
        open={copyOpen}
        currentPlanId={plan?.id}
        onClose={() => setCopyOpen(false)}
        onCopy={(copied) => form.setFieldValue('assignments', [...(form.getFieldValue('assignments') ?? []), ...copied])}
      />
    </DetailDrawer>
  )
}
