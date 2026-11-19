import { useState } from 'react'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { FrequencyFormModal } from '@/features/criteria/components/FrequencyFormModal'
import { FrequencyVersionTable } from '@/features/criteria/components/FrequencyVersionTable'
import { RuleHistoryModal } from '@/features/criteria/components/RuleHistoryModal'
import { RuleSummaryCard } from '@/features/criteria/components/RuleSummaryCard'
import type { FrequencyConfig } from '@/features/criteria/criteria.types'
import { useDeleteFrequency, useFrequencyConfigs } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { formatDate } from '@/utils/format-date'

/** Danh mục 8: kỳ đếm tần suất (dùng chung cả chuỗi), theo phiên bản ngày áp dụng. */
export function FrequencyCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const configs = useFrequencyConfigs()
  const remove = useDeleteFrequency()
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const list = configs.data ?? []
  const current = list.find((c) => c.status === 'CURRENT')
  const scheduled = list.filter((c) => c.status === 'SCHEDULED').at(-1)

  const onDelete = async (c: FrequencyConfig) => {
    if (!(await confirm({ title: `Xoá phiên bản áp dụng từ ${formatDate(c.effectiveFrom)}?`, okText: 'Xoá', danger: true }))) return
    remove.mutate(c.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  return (
    <>
      <RuleSummaryCard
        step={1}
        title="Kỳ đếm tần suất"
        purpose="Mỗi khi có lỗi, hệ thống lùi lại bấy nhiêu tháng (tính cả tháng hiện tại) để đếm số lần nhà hàng mắc lại cùng tiêu chí."
        loading={configs.isLoading}
        value={current && `${current.periodMonths} tháng`}
        since={current?.effectiveFrom}
        scheduled={scheduled && { label: <b>{scheduled.periodMonths} tháng</b>, from: scheduled.effectiveFrom }}
        footnote={current && `Ví dụ: lỗi ngày 20/08 → đếm các lần lỗi từ 01/${String(((8 - current.periodMonths) % 12 + 12) % 12 + 1).padStart(2, '0')} đến 20/08.`}
        emptyText="Chưa khai báo – đang dùng mặc định 6 tháng"
        historyCount={list.length}
        onChange={() => setFormOpen(true)}
        onHistory={() => setHistoryOpen(true)}
      />
      <FrequencyFormModal open={formOpen} currentMonths={current?.periodMonths} onClose={() => setFormOpen(false)} />
      <RuleHistoryModal open={historyOpen} title="Lịch sử kỳ đếm tần suất" onClose={() => setHistoryOpen(false)}>
        <FrequencyVersionTable configs={list} loading={configs.isFetching} onDelete={(c) => void onDelete(c)} />
      </RuleHistoryModal>
    </>
  )
}
