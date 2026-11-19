import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, Flex, Form, Modal, Space, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormDatePicker } from '@/components/data-entry/FormDatePicker'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { ConfigStatus, FrequencyConfig } from '@/features/criteria/criteria.types'
import { useCreateFrequency, useDeleteFrequency, useFrequencyConfigs } from '@/features/criteria/hooks/useRiskConfig'
import {
  FREQUENCY_PERIOD_MAX,
  FREQUENCY_PERIOD_MIN,
  FREQUENCY_PERIOD_PRESETS,
  frequencySchema,
  type FrequencyFormValues,
} from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'
import { ActionButton } from '@/components/data-display/TableActions'

/** Danh mục 8: kỳ đếm tần suất, theo phiên bản ngày hiệu lực. */
export function FrequencyCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const configs = useFrequencyConfigs()
  const create = useCreateFrequency()
  const remove = useDeleteFrequency()
  const [open, setOpen] = useState(false)
  const { control, handleSubmit, reset, setError, setValue } = useForm<FrequencyFormValues>({
    resolver: zodResolver(frequencySchema),
    defaultValues: { periodMonths: 6, effectiveFrom: '', note: '' },
  })

  const onSubmit = handleSubmit((v) =>
    create.mutate(
      { ...v, note: v.note || undefined },
      {
        onSuccess: () => {
          notify.success('Đã thêm phiên bản cấu hình tần suất')
          setOpen(false)
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  const onDelete = async (c: FrequencyConfig) => {
    if (!(await confirm({ title: `Xoá phiên bản hiệu lực từ ${formatDate(c.effectiveFrom)}?`, okText: 'Xoá', danger: true }))) return
    remove.mutate(c.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  const current = configs.data?.find((c) => c.status === 'CURRENT')

  return (
    <Card
      title="Chu kỳ theo dõi vi phạm (Tần suất tái diễn)"
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              reset({ periodMonths: 6, effectiveFrom: dayjs().format('YYYY-MM-DD'), note: '' })
              setOpen(true)
            }}
          >
            Thêm phiên bản
          </Button>
        </ProtectedAction>
      }
    >
      {current && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Đang áp dụng từ {formatDate(current.effectiveFrom)}: Tần suất tái phạm được tính theo tổng số lần đánh giá "Không đạt" đối với cùng một tiêu chí tại cùng một cơ sở trong {current.periodMonths} tháng dương lịch gần nhất (bao gồm tháng hiện tại).
        </Typography.Paragraph>
      )}
      <Table<FrequencyConfig>
        rowKey="id"
        size="small"
        loading={configs.isFetching}
        dataSource={configs.data}
        pagination={false}
        columns={[
          { title: 'Chu kỳ theo dõi', dataIndex: 'periodMonths', render: (m: number) => <strong>{m} tháng</strong> },
          { title: 'Hiệu lực từ', dataIndex: 'effectiveFrom', render: formatDate },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: ConfigStatus) => <ConfigStatusTag status={s} /> },
          { title: 'Ghi chú', dataIndex: 'note', render: (n: string | null) => n ?? '—' },
          {
            title: 'Tạo bởi',
            key: 'by',
            render: (_: unknown, c: FrequencyConfig) => (
              <Flex vertical>
                <span>{c.createdByName ?? 'Hệ thống'}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(c.createdAt)}
                </Typography.Text>
              </Flex>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 50,
            render: (_: unknown, c: FrequencyConfig) =>
              c.status === 'SCHEDULED' && (
                <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                  <ActionButton tone="delete" icon={<DeleteOutlined />} tooltip="Xoá phiên bản" onClick={() => void onDelete(c)} />
                </ProtectedAction>
              ),
          },
        ]}
      />
      <Modal
        open={open}
        title="Thiết lập phiên bản chu kỳ theo dõi vi phạm"
        okText="Lưu"
        cancelText="Huỷ"
        centered
        styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 } }}
        confirmLoading={create.isPending}
        onOk={() => void onSubmit()}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={() => void onSubmit()}>
          {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
          <button type="submit" hidden />
          <FormNumber
            control={control}
            name="periodMonths"
            label="Chu kỳ theo dõi (tháng)"
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
                <span>· hoặc nhập số từ {FREQUENCY_PERIOD_MIN} đến {FREQUENCY_PERIOD_MAX}</span>
              </Space>
            }
          />
          <FormDatePicker
            control={control}
            name="effectiveFrom"
            label="Hiệu lực từ ngày"
            required
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            extra="Ngày bắt đầu có hiệu lực mới. Dữ liệu trong quá khứ được giữ nguyên để đối soát lịch sử."
          />
          <FormInput control={control} name="note" label="Ghi chú" maxLength={500} />
        </Form>
      </Modal>
    </Card>
  )
}
