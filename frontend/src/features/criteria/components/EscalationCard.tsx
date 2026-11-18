import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, Col, Flex, Form, Modal, Row, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormDatePicker } from '@/components/data-entry/FormDatePicker'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import type { ConfigStatus, EscalationRule } from '@/features/criteria/criteria.types'
import { useCreateEscalation, useDeleteEscalation, useEscalationRules } from '@/features/criteria/hooks/useRiskConfig'
import { escalationSchema, type EscalationFormValues } from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

/** Danh mục 9: quy tắc nâng mức ảnh hưởng khi lỗi lặp lại, theo phiên bản ngày hiệu lực. */
export function EscalationCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const rules = useEscalationRules()
  const create = useCreateEscalation()
  const remove = useDeleteEscalation()
  const [open, setOpen] = useState(false)
  const current = rules.data?.find((r) => r.status === 'CURRENT')
  const { control, handleSubmit, reset, setError } = useForm<EscalationFormValues>({
    resolver: zodResolver(escalationSchema),
    defaultValues: { thresholdCount: 3, stepIncrease: 1, maxImpact: 5, resetPeriodMonths: 6, effectiveFrom: '', note: '' },
  })

  const onSubmit = handleSubmit((v) =>
    create.mutate(
      { ...v, note: v.note || undefined },
      {
        onSuccess: () => {
          notify.success('Đã thêm phiên bản quy tắc nâng mức')
          setOpen(false)
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  const onDelete = async (r: EscalationRule) => {
    if (!(await confirm({ title: `Xoá phiên bản hiệu lực từ ${formatDate(r.effectiveFrom)}?`, okText: 'Xoá', danger: true }))) return
    remove.mutate(r.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  return (
    <Card
      title="Quy tắc nâng mức ảnh hưởng"
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              reset({
                thresholdCount: current?.thresholdCount ?? 3,
                stepIncrease: current?.stepIncrease ?? 1,
                maxImpact: current?.maxImpact ?? 5,
                resetPeriodMonths: current?.resetPeriodMonths ?? 6,
                effectiveFrom: dayjs().format('YYYY-MM-DD'),
                note: '',
              })
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
          Đang áp dụng từ {formatDate(current.effectiveFrom)}: lỗi từ {current.thresholdCount} lần trong kỳ đếm thì mức ảnh
          hưởng +{current.stepIncrease} bậc (tối đa mức {current.maxImpact}); {current.resetPeriodMonths} tháng liên tục
          không lỗi thì về mức gốc.
        </Typography.Paragraph>
      )}
      <Table<EscalationRule>
        rowKey="id"
        size="small"
        loading={rules.isFetching}
        dataSource={rules.data}
        pagination={false}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Ngưỡng', dataIndex: 'thresholdCount', render: (n: number) => `${n} lần` },
          { title: 'Nâng', dataIndex: 'stepIncrease', render: (n: number) => `+${n} bậc` },
          { title: 'Mức trần', dataIndex: 'maxImpact' },
          { title: 'Hạ lại sau', dataIndex: 'resetPeriodMonths', render: (n: number) => `${n} tháng` },
          { title: 'Hiệu lực từ', dataIndex: 'effectiveFrom', render: formatDate },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: ConfigStatus) => <ConfigStatusTag status={s} /> },
          {
            title: 'Tạo bởi',
            key: 'by',
            render: (_: unknown, r: EscalationRule) => (
              <Flex vertical>
                <span>{r.createdByName ?? 'Hệ thống'}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(r.createdAt)}
                </Typography.Text>
              </Flex>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 50,
            render: (_: unknown, r: EscalationRule) =>
              r.status === 'SCHEDULED' && (
                <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xoá phiên bản" onClick={() => void onDelete(r)} />
                </ProtectedAction>
              ),
          },
        ]}
      />
      <Modal
        open={open}
        title="Thêm phiên bản quy tắc nâng mức"
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
          <Row gutter={16}>
            <Col span={12}>
              <FormNumber control={control} name="thresholdCount" label="Ngưỡng (số lần lỗi trong kỳ)" required min={2} max={50} precision={0} />
            </Col>
            <Col span={12}>
              <FormNumber control={control} name="stepIncrease" label="Số bậc tăng" required min={1} max={4} precision={0} />
            </Col>
            <Col span={12}>
              <FormNumber control={control} name="maxImpact" label="Mức trần (1–5)" required min={1} max={5} precision={0} />
            </Col>
            <Col span={12}>
              <FormNumber control={control} name="resetPeriodMonths" label="Hạ lại sau (tháng không lỗi)" required min={1} max={24} precision={0} />
            </Col>
          </Row>
          <FormDatePicker
            control={control}
            name="effectiveFrom"
            label="Hiệu lực từ ngày"
            required
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          />
          <FormInput control={control} name="note" label="Ghi chú" maxLength={500} />
        </Form>
      </Modal>
    </Card>
  )
}
