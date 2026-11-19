import { Flex, Modal, Select, Spin, Typography } from 'antd'
import { useState } from 'react'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { BatchCriterionContent } from './BatchCriterionContent'

export interface CriterionBatchModalProps {
  open: boolean
  groups: readonly CriterionGroup[]
  defaultGroupId?: number | null
  /** Ghi chú dưới tiêu đề, vd khi vừa tạo nhóm. */
  hint?: string
  onClose: () => void
}

/** Modal Thêm tiêu chí: một danh sách nhập dùng chung cho thêm 1 hoặc nhiều tiêu chí vào một nhóm. */
export function CriterionBatchModal({ open, groups, defaultGroupId, hint, onClose }: CriterionBatchModalProps) {
  const active = groups.filter((g) => g.active)
  const [picked, setPicked] = useState<number>()
  const groupId = picked ?? (active.some((g) => g.id === defaultGroupId) ? defaultGroupId ?? undefined : active[0]?.id)
  const group = active.find((g) => g.id === groupId)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={() => setPicked(undefined)}
      footer={null}
      width="min(920px, 94vw)"
      centered
      destroyOnHidden
      mask={{ closable: false }}
      className="batch-modal"
      title={null}
    >
      <div className="batch-modal__header">
        <div className="batch-modal__title">Thêm tiêu chí</div>
        <Flex align="center" gap={8} wrap className="batch-modal__group">
          <span>vào nhóm</span>
          <Select
            variant="borderless"
            value={groupId}
            onChange={setPicked}
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Chọn nhóm"
            popupMatchSelectWidth={false}
            options={active.map((g) => ({ value: g.id, label: g.name }))}
            className="batch-modal__group-select"
          />
          {group && (
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              · đang có {group.criterionCount} tiêu chí · {group.companyName ?? 'dùng chung mọi công ty'}
            </Typography.Text>
          )}
        </Flex>
        {hint && <div className="batch-modal__hint">{hint}</div>}
      </div>
      {group ? (
        <BatchCriterionContent key={group.id} group={group} onClose={onClose} />
      ) : (
        <Flex justify="center" style={{ padding: 48 }}>
          {active.length === 0 ? <Typography.Text type="secondary">Chưa có nhóm tiêu chí đang hoạt động. Hãy tạo nhóm trước.</Typography.Text> : <Spin />}
        </Flex>
      )}
    </Modal>
  )
}
