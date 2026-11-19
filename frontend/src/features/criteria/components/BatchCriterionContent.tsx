import { Button, Flex, Space, Spin, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotify } from '@/components/feedback/useNotify'
import type { CriterionGroup, CriterionPayload } from '@/features/criteria/criteria.types'
import { useBatchSaveCriteria, useCriteriaList } from '@/features/criteria/hooks/useCriteria'
import { getErrorMessage } from '@/lib/http'
import { BatchCriterionList } from './BatchCriterionList'
import { BatchPasteBox } from './BatchPasteBox'
import { BatchToolbar } from './BatchToolbar'
import { formatCode, getPrefix, newRow, parsePasted, type BatchItem } from './batchCriterion.types'

export interface BatchCriterionContentProps {
  group: CriterionGroup
  onClose: () => void
}

/** Chờ tải tiêu chí hiện có của nhóm để mã tự sinh nối tiếp, không trùng mã cũ. */
export function BatchCriterionContent({ group, onClose }: BatchCriterionContentProps) {
  const existing = useCriteriaList({ groupId: group.id, page: 0, size: 100 })
  const prefix = getPrefix(group.code)
  const nextSeq = useMemo(() => {
    let max = 0
    for (const c of existing.data?.items ?? []) {
      const m = new RegExp(`^${prefix}[-_]?(\\d+)$`, 'i').exec(c.code)
      if (m?.[1]) max = Math.max(max, Number.parseInt(m[1], 10))
    }
    return max + 1
  }, [existing.data, prefix])

  if (existing.isLoading) return <Flex justify="center" style={{ padding: 48 }}><Spin /></Flex>
  return <BatchEditor group={group} prefix={prefix} nextSeq={nextSeq} onClose={onClose} />
}

function BatchEditor({ group, prefix, nextSeq, onClose }: BatchCriterionContentProps & { prefix: string; nextSeq: number }) {
  const notify = useNotify()
  const batchSave = useBatchSaveCriteria()
  const [items, setItems] = useState<BatchItem[]>(() => [newRow()])
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  // Dòng cần đặt con trỏ sau lần render kế tiếp (mở modal → dòng 1; Enter → dòng sau).
  const pendingFocus = useRef<number | null>(0)
  useEffect(() => {
    if (pendingFocus.current === null) return
    document.querySelector<HTMLTextAreaElement>(`[data-batch-name="${pendingFocus.current}"]`)?.focus()
    pendingFocus.current = null
  })

  const update = <K extends keyof BatchItem>(key: string, field: K, value: BatchItem[K]) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)))
  const addRowAndFocus = (index: number) => {
    pendingFocus.current = index
    if (index >= items.length) setItems((prev) => [...prev, newRow()])
    else setItems((prev) => [...prev])
  }

  const applyPaste = (mode: 'replace' | 'append') => {
    const rows = parsePasted(pasteText)
    setItems((prev) => [...(mode === 'append' ? prev.filter((r) => r.name.trim()) : []), ...rows.map((r) => newRow(r))])
    setPasteText('')
    setPasteOpen(false)
    notify.success(`Đã thêm ${rows.length} tiêu chí vào danh sách`)
  }

  const filled = items.filter((r) => r.name.trim())
  const firstCode = formatCode(prefix, nextSeq)
  const lastCode = formatCode(prefix, nextSeq + Math.max(filled.length - 1, 0))

  const save = async () => {
    // Mã tự sinh nối tiếp mã lớn nhất hiện có của nhóm.
    const payloads: CriterionPayload[] = filled.map((r, idx) => ({
      groupId: group.id,
      code: formatCode(prefix, nextSeq + idx),
      name: r.name.trim(),
      baseImpact: r.baseImpact,
      checkMethod: r.checkMethod.trim() || undefined,
      evidenceRequired: r.evidenceRequired.trim() || undefined,
      sortOrder: nextSeq + idx,
      active: true,
      templateIds: [],
    }))
    try {
      await batchSave.mutateAsync(payloads)
      notify.success(`Đã thêm ${payloads.length} tiêu chí vào nhóm "${group.name}"`)
      onClose()
    } catch (err) {
      notify.error(getErrorMessage(err))
    }
  }

  return (
    <>
      <div className="batch-modal__body">
        <BatchToolbar
          count={filled.length}
          pasteOpen={pasteOpen}
          onTogglePaste={() => setPasteOpen((v) => !v)}
          onApplyImpact={(v) => setItems((p) => p.map((x) => ({ ...x, baseImpact: v })))}
          onClearEmpty={() => setItems((p) => (p.some((x) => x.name.trim()) ? p.filter((x) => x.name.trim()) : [newRow()]))}
        />
        {pasteOpen && <BatchPasteBox pasteText={pasteText} onChangeText={setPasteText} onClose={() => setPasteOpen(false)} onApply={applyPaste} />}
        <div className="batch-modal__scroll">
          <BatchCriterionList
            items={items}
            onUpdateItem={update}
            onRemoveItem={(key) => setItems((p) => (p.length > 1 ? p.filter((it) => it.key !== key) : [newRow()]))}
            onEnterNext={(i) => addRowAndFocus(i + 1)}
            onAddRow={() => addRowAndFocus(items.length)}
          />
        </div>
      </div>
      <div className="batch-modal__footer">
        <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
          {filled.length > 0
            ? `Mã tự sinh: ${firstCode}${filled.length > 1 ? ` → ${lastCode}` : ''}`
            : 'Mã tiêu chí được tự sinh khi lưu'}
        </Typography.Text>
        <Space size={8}>
          <Button onClick={onClose}>Huỷ</Button>
          <Button type="primary" loading={batchSave.isPending} disabled={filled.length === 0} onClick={() => void save()}>
            {filled.length > 1 ? `Thêm ${filled.length} tiêu chí` : 'Thêm tiêu chí'}
          </Button>
        </Space>
      </div>
    </>
  )
}
