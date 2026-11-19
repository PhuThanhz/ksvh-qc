import { useState } from 'react'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { EscalationFormModal } from '@/features/criteria/components/EscalationFormModal'
import { EscalationVersionTable } from '@/features/criteria/components/EscalationVersionTable'
import { RuleHistoryModal } from '@/features/criteria/components/RuleHistoryModal'
import { RuleSummaryCard } from '@/features/criteria/components/RuleSummaryCard'
import type { EscalationRule } from '@/features/criteria/criteria.types'
import { useDeleteEscalation, useEscalationRules } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { formatDate } from '@/utils/format-date'

/**
 * Danh mục 9: quy tắc nâng / hạ mức chung cho cả chuỗi, phiên bản theo ngày áp dụng.
 * Nhà hàng cần khác (vd fine dining) khai báo ngưỡng riêng ở Danh mục cơ sở.
 */
export function EscalationCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const rules = useEscalationRules()
  const remove = useDeleteEscalation()
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const list = rules.data ?? []
  const current = list.find((r) => r.status === 'CURRENT')
  const scheduled = list.filter((r) => r.status === 'SCHEDULED').at(-1)

  const onDelete = async (r: EscalationRule) => {
    if (!(await confirm({ title: `Xoá phiên bản áp dụng từ ${formatDate(r.effectiveFrom)}?`, okText: 'Xoá', danger: true }))) return
    remove.mutate(r.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  return (
    <>
      <RuleSummaryCard
        step={2}
        title="Nâng / hạ mức khi tái phạm"
        purpose="Tái phạm đủ số lần trong kỳ đếm thì mức ảnh hưởng của tiêu chí được nâng thêm bậc; sạch lỗi đủ lâu thì hạ về mức gốc."
        loading={rules.isLoading}
        value={current && <>Từ lần thứ {current.thresholdCount} → +{current.stepIncrease} bậc</>}
        details={
          current && (
            <>
              Tối đa mức {current.maxImpact} · Hạ về mức gốc sau {current.resetPeriodMonths} tháng liên tục không lỗi
            </>
          )
        }
        since={current?.effectiveFrom}
        scheduled={
          scheduled && {
            label: <b>từ lần thứ {scheduled.thresholdCount}, +{scheduled.stepIncrease} bậc</b>,
            from: scheduled.effectiveFrom,
          }
        }
        footnote="Nhà hàng cần khắt khe hơn (vd fine dining) đặt ngưỡng riêng trong form Nhà hàng ở Danh mục cơ sở."
        emptyText="Chưa khai báo – hiện không nâng mức"
        historyCount={list.length}
        onChange={() => setFormOpen(true)}
        onHistory={() => setHistoryOpen(true)}
      />
      <EscalationFormModal open={formOpen} current={current} onClose={() => setFormOpen(false)} />
      <RuleHistoryModal open={historyOpen} title="Lịch sử quy tắc nâng / hạ mức" onClose={() => setHistoryOpen(false)}>
        <EscalationVersionTable rules={list} loading={rules.isFetching} onDelete={(r) => void onDelete(r)} />
      </RuleHistoryModal>
    </>
  )
}
