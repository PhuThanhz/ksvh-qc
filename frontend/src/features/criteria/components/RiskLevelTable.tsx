import { DeleteOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Table, Tooltip, Typography } from 'antd'
import { severityColor } from '@/components/charts'
import type { Control } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import type { RiskLevel } from '@/features/criteria/criteria.types'
import type { RiskLevelsFormValues } from '@/features/criteria/schemas/criteria.schema'

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
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: 'Mã mức',
            width: 120,
            render: (_, __, i) => (
              <Flex align="center" gap={8}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: severityColor(i, fields.length), flexShrink: 0 }} />
                <FormInput control={control} name={`levels.${i}.code`} disabled={!editable} maxLength={10} style={{ width: 72 }} />
              </Flex>
            ),
          },
          {
            title: 'Tên mức',
            width: 170,
            render: (_, __, i) => (
              <FormInput
                control={control}
                name={`levels.${i}.name`}
                disabled={!editable}
                maxLength={100}
                placeholder="VD: Thấp"
              />
            ),
          },
          {
            title: 'Điểm từ (≥)',
            width: 110,
            render: (_, __, i) => (
              <div style={{ lineHeight: '32px' }}>
                <Typography.Text strong>{preview[i]?.minScore ?? 0}</Typography.Text>
              </div>
            ),
          },
          {
            title: 'Đến (<)',
            width: 140,
            render: (_, __, i) =>
              i === fields.length - 1 ? (
                <div style={{ lineHeight: '32px' }}>
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
                />
              ),
          },
          {
            title: 'Hạn khắc phục (ngày)',
            width: 140,
            render: (_, __, i) => (
              <FormNumber
                control={control}
                name={`levels.${i}.remediationDays`}
                disabled={!editable}
                min={1}
                max={365}
                precision={0}
              />
            ),
          },
          {
            title: 'Hành động bắt buộc',
            width: 280,
            render: (_, __, i) => (
              <FormInput
                control={control}
                name={`levels.${i}.action`}
                disabled={!editable}
                maxLength={500}
                placeholder="Hành động khi vi phạm"
              />
            ),
          },
          ...(editable
            ? [
                {
                  title: 'Thao tác',
                  key: 'remove',
                  width: 90,
                  render: (_: unknown, __: unknown, i: number) => (
                    <div style={{ lineHeight: '32px' }}>
                      <Tooltip title={fields.length <= 1 ? 'Phải giữ ít nhất 1 mức' : 'Xoá mức này'}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={fields.length <= 1}
                          onClick={() => onRemove(i)}
                        >
                          Xoá
                        </Button>
                      </Tooltip>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </Form>
  )
}
