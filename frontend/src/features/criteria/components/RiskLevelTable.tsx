import { DeleteOutlined } from '@ant-design/icons'
import { Flex, Form, Table, Typography } from 'antd'
import { severityColor } from '@/components/charts'
import type { Control } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { FormTextarea } from '@/components/data-entry/FormTextarea'
import type { RiskLevel } from '@/features/criteria/criteria.types'
import type { RiskLevelsFormValues } from '@/features/criteria/schemas/criteria.schema'
import { ActionButton } from '@/components/data-display/TableActions'

export interface RiskLevelTableProps {
  control: Control<RiskLevelsFormValues>
  fields: { id: string }[]
  preview: readonly RiskLevel[]
  editable: boolean
  onRemove: (index: number) => void
}

export function RiskLevelTable({
  control,
  fields,
  preview,
  editable,
  onRemove,
}: RiskLevelTableProps) {
  return (
    <Form component={false}>
      <Table<(typeof fields)[number]>
        rowKey="id"
        className="compact-table-form"
        dataSource={fields}
        pagination={false}
        scroll={{ x: 960 }}
        columns={[
          {
            title: 'Mã mức',
            className: 'col-code',
            width: 110,
            render: (_, __, i) => (
              <Flex align="center" gap={8}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: severityColor(i, fields.length), flexShrink: 0 }} />
                <FormInput control={control} name={`levels.${i}.code`} disabled={!editable} maxLength={10} style={{ width: 72 }} />
              </Flex>
            ),
          },
          {
            title: 'Tên mức',
            width: 155,
            render: (_, __, i) => (
              <FormInput
                control={control}
                name={`levels.${i}.name`}
                disabled={!editable}
                maxLength={100}
                placeholder="VD: Thấp"
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: 'Điểm từ (≥)',
            width: 100,
            render: (_, __, i) => (
              <div style={{ lineHeight: '36px' }}>
                <Typography.Text strong>{preview[i]?.minScore ?? 0}</Typography.Text>
              </div>
            ),
          },
          {
            title: 'Đến (<)',
            width: 125,
            render: (_, __, i) =>
              i === fields.length - 1 ? (
                <div style={{ lineHeight: '36px' }}>
                  <Typography.Text type="secondary">Không giới hạn</Typography.Text>
                </div>
              ) : (
                <FormNumber
                  control={control}
                  name={`levels.${i}.maxScore`}
                  disabled={!editable}
                  min={0}
                  step={1}
                  placeholder="Điểm trần"
                  style={{ width: '100%' }}
                />
              ),
          },
          {
            title: 'Hạn khắc phục (ngày)',
            width: 150,
            render: (_, __, i) => (
              <FormNumber
                control={control}
                name={`levels.${i}.remediationDays`}
                disabled={!editable}
                min={1}
                max={365}
                precision={0}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: 'Hành động bắt buộc',
            render: (_, __, i) => (
              <FormTextarea
                control={control}
                name={`levels.${i}.action`}
                disabled={!editable}
                maxLength={500}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Hành động khi vi phạm (VD: Lập biên bản, báo cáo lãnh đạo...)"
                style={{ width: '100%' }}
              />
            ),
          },
          ...(editable
            ? [
                {
                  title: 'Thao tác',
                  key: 'remove',
                  width: 80,
                  align: 'center' as const,
                  render: (_: unknown, __: unknown, i: number) => (
                    <ActionButton
                      tone="delete"
                      icon={<DeleteOutlined />}
                      tooltip="Xoá mức này"
                      disabledReason={fields.length <= 1 ? 'Phải giữ ít nhất 1 mức' : undefined}
                      onClick={() => onRemove(i)}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </Form>
  )
}
