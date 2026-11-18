import { Button, Flex, Select, Space, Tag, Transfer } from 'antd'
import { useState } from 'react'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion } from '@/features/criteria/criteria.types'

export interface TransferItem {
  key: string
  title: string
  description?: string
  groupId: number
  impact: number
}

interface Props {
  all: Criterion[]
  items: TransferItem[]
  targetKeys: number[]
  onChange: (keys: number[]) => void
  groupOptions: { value: number; label: string }[]
}

export function TemplateCriteriaTransfer({
  all,
  items,
  targetKeys,
  onChange,
  groupOptions,
}: Props) {
  const [filterGroupId, setFilterGroupId] = useState<number>()

  const addAllInGroup = () => {
    if (!filterGroupId) return
    const groupIds = all.filter((c) => c.groupId === filterGroupId).map((c) => c.id)
    onChange(Array.from(new Set([...targetKeys, ...groupIds])))
  }

  const removeAllInGroup = () => {
    if (!filterGroupId) return
    const groupIds = new Set(all.filter((c) => c.groupId === filterGroupId).map((c) => c.id))
    onChange(targetKeys.filter((id) => !groupIds.has(id)))
  }

  return (
    <Flex vertical gap={8}>
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Flex align="center" gap={8} wrap="wrap">
          <span style={{ fontSize: 13, color: 'var(--app-text-body)' }}>Lọc nhanh theo nhóm:</span>
          <Select
            placeholder="Tất cả nhóm"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 260 }}
            value={filterGroupId}
            onChange={setFilterGroupId}
            options={groupOptions}
          />
          <Tag color={targetKeys.length > 0 ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
            Đã chọn: {targetKeys.length} / {items.length} tiêu chí
          </Tag>
        </Flex>
        {filterGroupId && (
          <Space size={8}>
            <Button size="small" type="dashed" onClick={addAllInGroup}>
              + Chọn tất cả nhóm này
            </Button>
            <Button size="small" type="text" danger onClick={removeAllInGroup}>
              Bỏ chọn nhóm này
            </Button>
          </Space>
        )}
      </Flex>
      <Transfer<TransferItem>
        dataSource={items}
        targetKeys={targetKeys.map(String)}
        onChange={(keys) => onChange(keys.map(Number))}
        render={(i) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ImpactTag value={i.impact} />
            <span title={i.title}>{i.title}</span>
          </span>
        )}
        showSearch={{ placeholder: 'Tìm theo mã hoặc tên tiêu chí' }}
        filterOption={(input, i) => {
          if (filterGroupId && i.groupId !== filterGroupId) return false
          if (!input) return true
          return `${i.title} ${i.description ?? ''}`.toLowerCase().includes(input.toLowerCase())
        }}
        titles={[`Danh mục (${items.length - targetKeys.length})`, `Đã chọn (${targetKeys.length})`]}
        listStyle={{ width: 'calc(50% - 24px)', height: 360 }}
        locale={{ itemUnit: 'tiêu chí', itemsUnit: 'tiêu chí', notFoundContent: 'Không có tiêu chí' }}
      />
    </Flex>
  )
}
