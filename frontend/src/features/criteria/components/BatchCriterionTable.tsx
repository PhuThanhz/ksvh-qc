import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm, Select, Space, Table, Tooltip } from 'antd'
import { useMemo } from 'react'
import { IMPACT_LEVELS } from '@/features/criteria/criteria.types'
import type { BatchItem } from './batchCriterion.types'

const IMPACT_OPTIONS = IMPACT_LEVELS.map((lvl) => ({
  value: lvl,
  label: `Mức ${lvl}`,
}))

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
      size="small"
      pagination={false}
      dataSource={items}
      columns={[
        { title: '#', key: 'idx', width: 44, align: 'center', render: (_, __, i) => i + 1 },
        {
          title: 'Mã tiêu chí (*)',
          key: 'code',
          width: 140,
          render: (_, r) => {
            const isDup = duplicateCodes.has(r.code.trim().toUpperCase())
            return (
              <Tooltip title={isDup ? 'Mã này đang bị trùng lặp trong bảng' : undefined}>
                <Input
                  size="small"
                  value={r.code}
                  status={isDup ? 'error' : ''}
                  placeholder="Mã..."
                  onChange={(e) => onUpdateItem(r.key, 'code', e.target.value.toUpperCase())}
                  style={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              </Tooltip>
            )
          },
        },
        {
          title: 'Tên tiêu chí con (*)',
          key: 'name',
          render: (_, r) => (
            <Input
              size="small"
              value={r.name}
              placeholder="VD: Sàn nhà sạch sẽ, không trơn trượt..."
              onChange={(e) => onUpdateItem(r.key, 'name', e.target.value)}
              status={!r.name.trim() && r.code.trim() ? 'warning' : ''}
            />
          ),
        },
        {
          title: 'Mức ảnh hưởng',
          key: 'baseImpact',
          width: 115,
          render: (_, r) => (
            <Select
              size="small"
              value={r.baseImpact}
              options={IMPACT_OPTIONS}
              onChange={(val) => onUpdateItem(r.key, 'baseImpact', val)}
              style={{ width: '100%' }}
            />
          ),
        },
        {
          title: 'Cách kiểm tra / Ghi chú',
          key: 'checkMethod',
          width: 210,
          render: (_, r) => (
            <Input
              size="small"
              value={r.checkMethod}
              placeholder="Quan sát / Đo đạc..."
              onChange={(e) => onUpdateItem(r.key, 'checkMethod', e.target.value)}
            />
          ),
        },
        {
          title: '',
          key: 'actions',
          width: 70,
          align: 'center',
          render: (_, r) => (
            <Space size={2}>
              {onDuplicateItem && (
                <Tooltip title="Nhân bản dòng này">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => onDuplicateItem(r)}
                  />
                </Tooltip>
              )}
              <Popconfirm title="Xoá dòng này?" onConfirm={() => onRemoveItem(r.key)}>
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  )
}
