import { DownOutlined } from '@ant-design/icons'
import { Modal } from 'antd'
import { useState } from 'react'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { SurpriseCriteriaPicker } from '@/features/inspections/components/SurpriseCriteriaPicker'

export interface PlanSurpriseScopeCellProps {
  restaurantName?: string
  /** Chuyên đề được phép với nhà hàng (đã lọc theo công ty). */
  groups: CriterionGroup[]
  topicGroupIds: number[]
  criterionIds: number[]
  onChange: (criterionIds: number[], topicGroupIds: number[]) => void
}

/**
 * Ô "Chuyên đề" của dòng đột xuất: tóm tắt số nhóm / số tiêu chí đã chọn,
 * bấm vào mở bộ chọn để tick cả nhóm hoặc từng tiêu chí cần đi chấm.
 */
export function PlanSurpriseScopeCell({ restaurantName, groups, topicGroupIds, criterionIds, onChange }: PlanSurpriseScopeCellProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<{ criterionIds: number[]; topicGroupIds: number[] }>({ criterionIds, topicGroupIds })
  const empty = topicGroupIds.length === 0

  const openPicker = () => {
    setDraft({ criterionIds, topicGroupIds })
    setOpen(true)
  }

  return (
    <>
      <button type="button" className={`plan-scope${empty ? ' is-empty' : ''}`} onClick={openPicker}>
        <span>
          {empty
            ? 'Chọn tiêu chí cần kiểm tra'
            : `${topicGroupIds.length} chuyên đề · ${criterionIds.length > 0 ? `${criterionIds.length} tiêu chí` : 'toàn bộ tiêu chí'}`}
        </span>
        <DownOutlined />
      </button>
      <Modal
        open={open}
        width={760}
        title={`Phạm vi kiểm tra đột xuất${restaurantName ? ` – ${restaurantName}` : ''}`}
        okText="Áp dụng"
        cancelText="Huỷ"
        okButtonProps={{ disabled: draft.topicGroupIds.length === 0 }}
        onOk={() => {
          onChange(draft.criterionIds, draft.topicGroupIds)
          setOpen(false)
        }}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <SurpriseCriteriaPicker
          groups={groups}
          selectedGroupIds={draft.topicGroupIds}
          selectedCriterionIds={draft.criterionIds}
          onChange={(cIds, gIds) => setDraft({ criterionIds: cIds, topicGroupIds: gIds })}
        />
      </Modal>
    </>
  )
}
