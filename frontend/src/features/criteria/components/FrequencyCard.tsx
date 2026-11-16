import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, Flex, Form, Modal, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormDatePicker } from '@/components/data-entry/FormDatePicker'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { ConfigStatus, FrequencyConfig } from '@/features/criteria/criteria.types'
import { useCreateFrequency, useDeleteFrequency, useFrequencyConfigs } from '@/features/criteria/hooks/useRiskConfig'
import { frequencySchema, type FrequencyFormValues } from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'
import { CurrentSummary } from '@/features/criteria/components/CurrentSummary'

const PERIOD_OPTIONS = [
  { value: 3, label: '3 tháng' },
  { value: 6, label: '6 tháng' },
]

/** Danh mục 8: kỳ đếm tần suất, theo phiên bản ngày hiệu lực. */
export function FrequencyCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const configs = useFrequencyConfigs()
  const create = useCreateFrequency()
  const remove = useDeleteFrequency()
  const [open, setOpen] = useState(false)
  const { control, handleSubmit, reset, setError } = useForm<FrequencyFormValues>({
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
      title="Cấu hình tần suất (kỳ đếm lỗi)"
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button
            type="primary"
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
        <CurrentSummary
          since={formatDate(current.effectiveFrom)}
          text={
            <>
              Tần suất = số lần lỗi của cùng tiêu chí tại cùng nhà hàng trong <b>{current.periodMonths} tháng</b> gần nhất
              (tính theo tháng dương lịch, gồm tháng hiện tại).
            </>
          }
        />
      )}
      <Table<FrequencyConfig>
        rowKey="id"
        size="small"
        loading={configs.isFetching}
        dataSource={configs.data}
        pagination={false}
        columns={[
          { title: 'Kỳ đếm', dataIndex: 'periodMonths', render: (m: number) => <strong>{m} tháng</strong> },
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
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xoá phiên bản" onClick={() => void onDelete(c)} />
                </ProtectedAction>
              ),
          },
        ]}
      />
      <Modal
        open={open}
        title="Thêm phiên bản cấu hình tần suất"
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
          <FormSelect<FrequencyFormValues, number> control={control} name="periodMonths" label="Kỳ đếm" required options={PERIOD_OPTIONS} />
          <FormDatePicker
            control={control}
            name="effectiveFrom"
            label="Hiệu lực từ ngày"
            required
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            extra="Không áp dụng ngược quá khứ. Phiên bản cũ giữ nguyên để tính lại đúng lịch sử."
          />
          <FormInput control={control} name="note" label="Ghi chú" maxLength={500} />
        </Form>
      </Modal>
    </Card>
  )
}
