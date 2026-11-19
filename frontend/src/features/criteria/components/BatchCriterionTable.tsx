import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm, Select, Space, Table, Tooltip } from 'antd'
import { useMemo } from 'react'
import type { BatchItem } from './batchCriterion.types'

const IMPACT_OPTIONS = [
  {
    value: 1,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#52c41a' }} />
        Mức 1
      </span>
    ),
  },
  {
    value: 2,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1677ff' }} />
        Mức 2
      </span>
    ),
  },
  {
    value: 3,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#faad14' }} />
        Mức 3
      </span>
    ),
  },
  {
    value: 4,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fa541c' }} />
        Mức 4
      </span>
    ),
  },
  {
    value: 5,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5222d' }} />
        Mức 5
      </span>
    ),
  },
]

export interface BatchCriterionTableProps {
  items: BatchItem[]
  onUpdateItem: (key: string, field: keyof BatchItem, value: unknown) => void
  onRemoveItem: (key: string) => void
  onDuplicateItem?: (item: BatchItem) => void
}

export function BatchCriterionTable({ items, onUpdateItem, onRemoveItem, onDuplicateItem }: BatchCriterionTableProps) {
  const duplicateCodes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of items) {
      const c = it.code.trim().toUpperCase()
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return new Set(Array.from(counts.entries()).filter(([, cnt]) => cnt > 1).map(([code]) => code))
  }, [items])

  return (
    <Table<BatchItem>
      rowKey="key"
      size="middle"
      pagination={false}
      dataSource={items}
      className="batch-criteria-table"
      bordered
      columns={[
        {
          title: '#',
          key: 'idx',
          width: 44,
          align: 'center',
          render: (_, __, i) => (
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{i + 1}</span>
          ),
        },
        {
          title: 'Mã tiêu chí (*)',
          key: 'code',
          width: 140,
          render: (_, r) => {
            const isDup = duplicateCodes.has(r.code.trim().toUpperCase())
            return (
              <Tooltip title={isDup ? 'Mã này đang bị trùng lặp trong bảng' : undefined}>
                <Input
                  value={r.code}
                  status={isDup ? 'error' : ''}
                  placeholder="Mã tiêu chí..."
                  onChange={(e) => onUpdateItem(r.key, 'code', e.target.value.toUpperCase())}
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: 12,
                    borderRadius: 6,
                    color: isDup ? '#dc2626' : '#1677ff',
                    background: '#f8fafc',
                  }}
                />
              </Tooltip>
            )
          },
        },
        {
          title: 'Nội dung tiêu chí kiểm soát (*)',
          key: 'name',
          render: (_, r) => (
            <Input
              value={r.name}
              placeholder="Nhập nội dung tiêu chí kiểm soát..."
              onChange={(e) => onUpdateItem(r.key, 'name', e.target.value)}
              status={!r.name.trim() && r.code.trim() ? 'warning' : ''}
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          ),
        },
        {
          title: 'Mức độ ảnh hưởng',
          key: 'baseImpact',
          width: 125,
          render: (_, r) => (
            <Select
              value={r.baseImpact}
              options={IMPACT_OPTIONS}
              onChange={(val) => onUpdateItem(r.key, 'baseImpact', val)}
              style={{ width: '100%' }}
            />
          ),
        },
        {
          title: 'Phương pháp đánh giá / Ghi chú',
          key: 'checkMethod',
          width: 210,
          render: (_, r) => (
            <Input
              value={r.checkMethod}
              placeholder="Phương pháp kiểm tra / ghi chú..."
              onChange={(e) => onUpdateItem(r.key, 'checkMethod', e.target.value)}
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          ),
        },
        {
          title: '',
          key: 'actions',
          width: 68,
          align: 'center',
          render: (_, r) => (
            <Space size={4}>
              {onDuplicateItem && (
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ color: '#64748b' }} />}
                  title="Nhân bản dòng này"
                  onClick={() => onDuplicateItem(r)}
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                />
              )}
              <Popconfirm title="Xoá dòng này?" onConfirm={() => onRemoveItem(r.key)}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  title="Xoá dòng"
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                />
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  )
}
