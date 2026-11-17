import { Flex, Modal, Select, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { BatchCriterionContent } from './BatchCriterionContent'
import type { BatchCriterionModalProps } from './batchCriterion.types'

export function BatchCriterionModal({ open, group, groups, onClose, onSuccess }: BatchCriterionModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(group?.id)
  const activeGroup = useMemo(() => {
    if (!groups?.length) return group
    return groups.find((g) => g.id === selectedGroupId) ?? group ?? groups[0]
  }, [groups, selectedGroupId, group])

  if (!open || !activeGroup) return null

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8} wrap="wrap">
          <Typography.Title level={5} style={{ margin: 0 }}>
            Thêm nhanh nhiều tiêu chí con
          </Typography.Title>
          {groups && groups.length > 1 ? (
            <Select
              size="small"
              value={activeGroup.id}
              onChange={(id) => setSelectedGroupId(id)}
              style={{ width: 280 }}
              options={groups.map((g) => ({
                value: g.id,
                label: `[${g.code}] ${g.name}`,
              }))}
            />
          ) : (
            <Tag style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {activeGroup.code} – {activeGroup.name}
            </Tag>
          )}
        </Flex>
      }
      width={1000}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 170px)', overflowY: 'auto' } }}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <BatchCriterionContent key={activeGroup.id} group={activeGroup} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}
