import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotify } from '@/components/feedback/useNotify'
import { formatCode, getPrefix, newRow, parsePasted, type BatchItem } from '@/features/criteria/components/batchCriterion.types'
import type { CriterionGroup, CriterionPayload } from '@/features/criteria/criteria.types'
import { useBatchSaveCriteria, useCriteriaList } from '@/features/criteria/hooks/useCriteria'
import { getErrorMessage } from '@/lib/http'

/**
 * Trạng thái danh sách "Thêm tiêu chí" cho một nhóm. Đổi nhóm giữa chừng vẫn giữ các dòng đã nhập;
 * mã tự sinh nối tiếp mã lớn nhất hiện có của nhóm đang chọn.
 */
export function useBatchCriterionEditor(group: CriterionGroup | undefined, onDone: () => void) {
  const notify = useNotify()
  const batchSave = useBatchSaveCriteria()
  const existing = useCriteriaList({ groupId: group?.id, page: 0, size: 100 })
  const prefix = getPrefix(group?.code)
  const nextSeq = useMemo(() => {
    let max = 0
    for (const c of existing.data?.items ?? []) {
      const m = new RegExp(`^${prefix}[-_]?(\\d+)$`, 'i').exec(c.code)
      if (m?.[1]) max = Math.max(max, Number.parseInt(m[1], 10))
    }
    return max + 1
  }, [existing.data, prefix])

  const [items, setItems] = useState<BatchItem[]>(() => [newRow()])

  // Dòng cần đặt con trỏ sau lần render kế tiếp (mở drawer → dòng 1; Enter → dòng sau).
  const pendingFocus = useRef<number | null>(0)
  useEffect(() => {
    if (pendingFocus.current === null) return
    const el = document.querySelector<HTMLTextAreaElement>(`[data-batch-name="${pendingFocus.current}"]`)
    if (!el) return
    el.focus()
    pendingFocus.current = null
  })

  const update = <K extends keyof BatchItem>(key: string, field: K, value: BatchItem[K]) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)))
  const remove = (key: string) => setItems((p) => (p.length > 1 ? p.filter((it) => it.key !== key) : [newRow()]))
  const focusRow = (index: number) => {
    pendingFocus.current = index
    if (index >= items.length) setItems((prev) => [...prev, newRow()])
    else setItems((prev) => [...prev])
  }
  const applyImpact = (v: number) => setItems((p) => p.map((x) => ({ ...x, baseImpact: v })))
  const clearEmpty = () => setItems((p) => (p.some((x) => x.name.trim()) ? p.filter((x) => x.name.trim()) : [newRow()]))
  const applyPaste = (text: string, mode: 'replace' | 'append') => {
    const rows = parsePasted(text)
    setItems((prev) => [...(mode === 'append' ? prev.filter((r) => r.name.trim()) : []), ...rows.map((r) => newRow(r))])
    notify.success(`Đã thêm ${rows.length} tiêu chí vào danh sách`)
  }

  const filled = items.filter((r) => r.name.trim())
  const firstCode = formatCode(prefix, nextSeq)
  const lastCode = formatCode(prefix, nextSeq + Math.max(filled.length - 1, 0))
  const codeNote = filled.length > 0
    ? `Mã tự sinh: ${firstCode}${filled.length > 1 ? ` → ${lastCode}` : ''}`
    : 'Mã tiêu chí được tự sinh khi lưu'

  const save = async () => {
    if (!group) return
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
      onDone()
    } catch (err) {
      notify.error(getErrorMessage(err))
    }
  }

  return {
    items, filledCount: filled.length, codeNote,
    loadingCodes: !!group && existing.isLoading,
    saving: batchSave.isPending,
    update, remove, focusRow, applyImpact, clearEmpty, applyPaste, save,
  }
}
