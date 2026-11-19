import { Flex, Select, Typography } from 'antd'
import { useState } from 'react'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { BatchCriterionContent } from './BatchCriterionContent'
import { getPrefix } from './batchCriterion.types'

export interface CriterionBatchPaneProps {
  groups: readonly CriterionGroup[]
  defaultGroupId?: number | null
  onClose: () => void
}

/** Chế độ "Nhiều tiêu chí cùng lúc" trong modal Thêm tiêu chí: chọn nhóm rồi nhập nhanh nhiều dòng. */
export function CriterionBatchPane({ groups, defaultGroupId, onClose }: CriterionBatchPaneProps) {
  const activeGroups = groups.filter((g) => g.active)
  const [groupId, setGroupId] = useState<number | undefined>(
    activeGroups.find((g) => g.id === defaultGroupId)?.id ?? activeGroups[0]?.id,
  )
  const group = activeGroups.find((g) => g.id === groupId)

  if (activeGroups.length === 0) {
    return <Typography.Text type="secondary">Chưa có nhóm tiêu chí nào đang hoạt động. Hãy tạo nhóm tiêu chí trước.</Typography.Text>
  }

  return (
    <Flex vertical gap={12}>
      <Flex
        align="center"
        justify="space-between"
        wrap
        gap={12}
        style={{
          padding: '10px 14px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        <Flex align="center" gap={10} wrap>
          <Typography.Text strong style={{ fontSize: 13, color: '#334155' }}>
            Thêm vào nhóm:
          </Typography.Text>
          <Select
            value={groupId}
            onChange={setGroupId}
            showSearch={{ optionFilterProp: 'label' }}
            style={{ minWidth: 320 }}
            options={activeGroups.map((g) => ({
              value: g.id,
              label: `${g.code} – ${g.name}${g.companyName ? ` (${g.companyName})` : ''}`,
            }))}
          />
        </Flex>
        {group && (
          <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Tiền tố mã tự động: <span className="code-tag--blue">{getPrefix(group.code)}</span>
          </span>
        )}
      </Flex>
      {group && <BatchCriterionContent key={group.id} group={group} onClose={onClose} />}
    </Flex>
  )
}
