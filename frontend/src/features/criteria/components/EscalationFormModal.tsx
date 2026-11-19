import { zodResolver } from '@hookform/resolvers/zod'
import { Col, Form, Modal, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormDatePicker } from '@/components/data-entry/FormDatePicker'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useNotify } from '@/components/feedback/useNotify'
import type { EscalationRule } from '@/features/criteria/criteria.types'
import { useCreateEscalation } from '@/features/criteria/hooks/useRiskConfig'
import { escalationSchema, type EscalationFormValues } from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

export interface EscalationFormModalProps {
  open: boolean
  /** Phiên bản đang áp dụng để điền sẵn. */
  current?: EscalationRule
  onClose: () => void
}

/** Thêm phiên bản quy tắc nâng mức chung. */
export function EscalationFormModal({ open, current, onClose }: EscalationFormModalProps) {
  const notify = useNotify()
  const create = useCreateEscalation()
  const { control, handleSubmit, reset, setError } = useForm<EscalationFormValues>({
    resolver: zodResolver(escalationSchema),
  })

  useEffect(() => {
    if (!open) return
    reset({
      thresholdCount: current?.thresholdCount ?? 3,
      stepIncrease: current?.stepIncrease ?? 1,
      maxImpact: current?.maxImpact ?? 5,
      resetPeriodMonths: current?.resetPeriodMonths ?? 6,
      effectiveFrom: dayjs().format('YYYY-MM-DD'),
      note: '',
    })
  }, [open, current, reset])

  const onSubmit = handleSubmit((v) =>
    create.mutate(
      { ...v, note: v.note || undefined },
      {
        onSuccess: () => {
          notify.success('Đã lưu quy tắc nâng / hạ mức mới')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  return (
    <Modal
      open={open}
      title="Thay đổi quy tắc nâng / hạ mức"
      okText="Lưu"
      cancelText="Huỷ"
      centered
      confirmLoading={create.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        <Row gutter={16}>
          <Col span={12}>
            <FormNumber control={control} name="thresholdCount" label="Ngưỡng tái phạm (lần trong kỳ)" required min={2} max={50} precision={0} />
          </Col>
          <Col span={12}>
            <FormNumber control={control} name="stepIncrease" label="Số bậc nâng (+)" required min={1} max={4} precision={0} />
          </Col>
          <Col span={12}>
            <FormNumber control={control} name="maxImpact" label="Mức ảnh hưởng tối đa (1–5)" required min={1} max={5} precision={0} />
          </Col>
          <Col span={12}>
            <FormNumber control={control} name="resetPeriodMonths" label="Hạ mức sau (tháng sạch lỗi)" required min={1} max={24} precision={0} />
          </Col>
        </Row>
        <FormDatePicker
          control={control}
          name="effectiveFrom"
          label="Áp dụng từ ngày"
          required
          disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          extra="Lỗi phát sinh trước ngày này vẫn tính theo quy tắc cũ."
        />
        <FormInput control={control} name="note" label="Ghi chú" maxLength={500} />
      </Form>
    </Modal>
  )
}
