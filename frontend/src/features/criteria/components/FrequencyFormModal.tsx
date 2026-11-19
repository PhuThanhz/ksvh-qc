import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Modal, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormDatePicker } from '@/components/data-entry/FormDatePicker'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useNotify } from '@/components/feedback/useNotify'
import { useCreateFrequency } from '@/features/criteria/hooks/useRiskConfig'
import {
  FREQUENCY_PERIOD_MAX,
  FREQUENCY_PERIOD_MIN,
  FREQUENCY_PERIOD_PRESETS,
  frequencySchema,
  type FrequencyFormValues,
} from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

export interface FrequencyFormModalProps {
  open: boolean
  currentMonths?: number
  onClose: () => void
}

/** Đổi kỳ đếm tần suất: tạo phiên bản mới có ngày áp dụng. */
export function FrequencyFormModal({ open, currentMonths, onClose }: FrequencyFormModalProps) {
  const notify = useNotify()
  const create = useCreateFrequency()
  const { control, handleSubmit, reset, setError, setValue } = useForm<FrequencyFormValues>({
    resolver: zodResolver(frequencySchema),
  })

  useEffect(() => {
    if (open) reset({ periodMonths: currentMonths ?? 6, effectiveFrom: dayjs().format('YYYY-MM-DD'), note: '' })
  }, [open, currentMonths, reset])

  const onSubmit = handleSubmit((v) =>
    create.mutate(
      { ...v, note: v.note || undefined },
      {
        onSuccess: () => {
          notify.success('Đã lưu kỳ đếm tần suất mới')
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
      title="Thay đổi kỳ đếm tần suất"
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
        <FormNumber
          control={control}
          name="periodMonths"
          label="Kỳ đếm (số tháng tính lùi từ ngày phát sinh lỗi)"
          required
          min={FREQUENCY_PERIOD_MIN}
          max={FREQUENCY_PERIOD_MAX}
          precision={0}
          suffix="tháng"
          extra={
            <Space size={4} wrap style={{ marginTop: 4 }}>
              <span>Chọn nhanh:</span>
              {FREQUENCY_PERIOD_PRESETS.map((m) => (
                <Button key={m} size="small" onClick={() => setValue('periodMonths', m, { shouldValidate: true })}>
                  {m} tháng
                </Button>
              ))}
            </Space>
          }
        />
        <FormDatePicker
          control={control}
          name="effectiveFrom"
          label="Áp dụng từ ngày"
          required
          disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          extra="Ngày bắt đầu dùng con số mới (không phải ngày bắt đầu kỳ đếm). Lỗi trước ngày này vẫn tính theo kỳ cũ."
        />
        <FormInput control={control} name="note" label="Ghi chú" maxLength={500} placeholder="VD: theo quyết định của Phòng KSVH ngày …" />
      </Form>
    </Modal>
  )
}
