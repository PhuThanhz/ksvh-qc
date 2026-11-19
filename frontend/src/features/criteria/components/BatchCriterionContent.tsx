import { Flex } from 'antd'
import { useMemo, useState } from 'react'
import { useNotify } from '@/components/feedback/useNotify'
import type { CriterionGroup, CriterionPayload } from '@/features/criteria/criteria.types'
import { useBatchSaveCriteria, useCriteriaList } from '@/features/criteria/hooks/useCriteria'
import { getErrorMessage } from '@/lib/http'
import { BatchActionBar } from './BatchActionBar'
import { BatchCriterionTable } from './BatchCriterionTable'
import { BatchPasteBox } from './BatchPasteBox'
import { getPrefix, type BatchItem } from './batchCriterion.types'

export interface BatchCriterionContentProps {
  group: CriterionGroup
  onClose: () => void
  onSuccess?: () => void
}

export function BatchCriterionContent({ group, onClose, onSuccess }: BatchCriterionContentProps) {
  const notify = useNotify()
  const batchSave = useBatchSaveCriteria()
  const { data: existingData } = useCriteriaList({ groupId: group.id, page: 0, size: 200 })

  const nextSeq = useMemo(() => {
    const prefix = getPrefix(group.code)
    let max = 0
    for (const c of existingData?.items ?? []) {
      const match = c.code.match(new RegExp(`^${prefix}[-_]?(\\d+)$`, 'i'))
      if (match && match[1]) {
        const num = Number.parseInt(match[1], 10)
        if (!Number.isNaN(num) && num > max) max = num
      }
    }
    return max + 1
  }, [existingData?.items, group.code])

  const [items, setItems] = useState<BatchItem[]>(() => {
    const prefix = getPrefix(group.code)
    return [1, 2, 3].map((idx) => ({
      key: `init-${idx}`,
      code: `${prefix}-${idx.toString().padStart(2, '0')}`,
      name: '',
      baseImpact: 2,
      checkMethod: '',
    }))
  })

  const [pasteText, setPasteText] = useState('')
  const [showPasteBox, setShowPasteBox] = useState(false)

  const addRows = (count: number) => {
    const prefix = getPrefix(group.code)
    const currentCount = items.length
    const newRows: BatchItem[] = Array.from({ length: count }).map((_, i) => ({
      key: `row-${Date.now()}-${i}-${Math.random()}`,
      code: `${prefix}-${(nextSeq + currentCount + i).toString().padStart(2, '0')}`,
      name: '',
      baseImpact: 2,
      checkMethod: '',
    }))
    setItems((prev) => [...prev, ...newRows])
  }

  const handleDuplicate = (item: BatchItem) => {
    const prefix = getPrefix(group.code)
    const newRow: BatchItem = {
      key: `dup-${Date.now()}-${Math.random()}`,
      code: `${prefix}-${(nextSeq + items.length).toString().padStart(2, '0')}`,
      name: `${item.name} (sao chép)`,
      baseImpact: item.baseImpact,
      checkMethod: item.checkMethod,
    }
    setItems((prev) => [...prev, newRow])
  }

  const handleApplyPaste = () => {
    const lines = pasteText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return
    const prefix = getPrefix(group.code)
    const pasted: BatchItem[] = lines.map((line, idx) => ({
      key: `paste-${Date.now()}-${idx}`,
      code: `${prefix}-${(nextSeq + idx).toString().padStart(2, '0')}`,
      name: line.replace(/^[-*•\d.)\s]+/, '').trim(),
      baseImpact: 2,
      checkMethod: '',
    }))
    setItems(pasted)
    setShowPasteBox(false)
    setPasteText('')
    notify.success(`Đã nạp ${pasted.length} dòng từ văn bản dán!`)
  }

  const handleAutoNumber = () => {
    const prefix = getPrefix(group.code)
    setItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        code: `${prefix}-${(nextSeq + idx).toString().padStart(2, '0')}`,
      })),
    )
    notify.success('Đã tự động đánh lại mã tiêu chí!')
  }

  const handleSave = async () => {
    const validRows = items.filter((r) => r.name.trim() !== '')
    if (validRows.length === 0) {
      notify.error('Vui lòng nhập ít nhất một tiêu chí kiểm soát!')
      return
    }
    const codes = new Set<string>()
    for (const r of validRows) {
      const c = r.code.trim().toUpperCase()
      if (!c) {
        notify.error('Mã tiêu chí không được để trống!')
        return
      }
      if (codes.has(c)) {
        notify.error(`Mã tiêu chí "${c}" bị trùng lặp!`)
        return
      }
      codes.add(c)
    }

    const payloads: CriterionPayload[] = validRows.map((r, idx) => ({
      groupId: group.id,
      code: r.code.trim().toUpperCase(),
      name: r.name.trim(),
      baseImpact: r.baseImpact,
      checkMethod: r.checkMethod.trim() || undefined,
      evidenceRequired: undefined,
      sortOrder: idx + 1,
      active: true,
      templateIds: [],
    }))

    try {
      await batchSave.mutateAsync(payloads)
      notify.success(`Đã thêm thành công ${payloads.length} tiêu chí kiểm soát vào nhóm "${group.name}"!`)
      onClose()
      onSuccess?.()
    } catch (err) {
      notify.error(getErrorMessage(err))
    }
  }

  const validCount = items.filter((r) => r.name.trim() !== '').length

  return (
    <Flex vertical gap={12}>
      {showPasteBox && (
        <BatchPasteBox
          pasteText={pasteText}
          onChangeText={setPasteText}
          onClose={() => setShowPasteBox(false)}
          onApply={handleApplyPaste}
        />
      )}
      <BatchCriterionTable
        items={items}
        onUpdateItem={(key, field, val) =>
          setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: val } : it)))
        }
        onRemoveItem={(key) => setItems((prev) => prev.filter((it) => it.key !== key))}
        onDuplicateItem={handleDuplicate}
      />
      <BatchActionBar
        showPasteBox={showPasteBox}
        validCount={validCount}
        totalCount={items.length}
        isPending={batchSave.isPending}
        onAddRows={addRows}
        onAutoNumber={handleAutoNumber}
        onClearEmpty={() => setItems((p) => p.filter((x) => x.name.trim() !== ''))}
        onChangeCommonImpact={(val) => setItems((p) => p.map((x) => ({ ...x, baseImpact: val })))}
        onTogglePasteBox={() => setShowPasteBox(!showPasteBox)}
        onClose={onClose}
        onSave={handleSave}
      />
    </Flex>
  )
}
