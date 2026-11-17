import { ClearOutlined, FileTextOutlined, PlusCircleOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Modal, Select, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNotify } from '@/components/feedback/useNotify'
import { IMPACT_LEVELS, type CriterionGroup, type CriterionPayload } from '@/features/criteria/criteria.types'
import { useBatchSaveCriteria, useCriteriaList } from '@/features/criteria/hooks/useCriteria'
import { getErrorMessage } from '@/lib/http'
import { BatchCriterionTable } from './BatchCriterionTable'
import { getPrefix, type BatchCriterionModalProps, type BatchItem } from './batchCriterion.types'

interface ContentProps {
  group: CriterionGroup
  onClose: () => void
  onSuccess?: () => void
}

function BatchCriterionContent({ group, onClose, onSuccess }: ContentProps) {
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
      key: `init-${idx}`, code: `${prefix}-${idx.toString().padStart(2, '0')}`, name: '', baseImpact: 2, checkMethod: '',
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
      name: '', baseImpact: 2, checkMethod: '',
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
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean)
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
      notify.error('Vui lòng nhập ít nhất một tiêu chí con!')
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
      notify.success(`Đã thêm thành công ${payloads.length} tiêu chí con vào nhóm "${group.name}"!`)
      onClose()
      onSuccess?.()
    } catch (err) {
      notify.error(getErrorMessage(err))
    }
  }

  const validCount = items.filter((r) => r.name.trim() !== '').length

  return (
    <Flex vertical gap={12}>
      <Alert
        type="info"
        showIcon
        message="Nhập nhanh nhiều tiêu chí con cho nhóm. Bạn có thể gõ từng dòng hoặc dán nhanh danh sách từ Word/Excel."
      />
      {showPasteBox && (
        <div style={{ background: 'var(--app-surface-muted)', padding: 12, borderRadius: 6, border: '1px dashed var(--app-border-strong)' }}>
          <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
            Dán danh sách tiêu chí vào đây (mỗi dòng là 1 tiêu chí con):
          </Typography.Text>
          <Input.TextArea
            rows={4}
            placeholder={'Sàn nhà sạch sẽ, khô ráo\nThùng rác có nắp đậy kín\nNhân viên đeo thẻ đúng quy định'}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
            <Button size="small" onClick={() => setShowPasteBox(false)}>Đóng</Button>
            <Button size="small" type="primary" disabled={!pasteText.trim()} onClick={handleApplyPaste}>
              Nạp vào bảng
            </Button>
          </Flex>
        </div>
      )}
      <BatchCriterionTable
        items={items}
        onUpdateItem={(key, field, val) =>
          setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: val } : it)))
        }
        onRemoveItem={(key) => setItems((prev) => prev.filter((it) => it.key !== key))}
        onDuplicateItem={handleDuplicate}
      />
      <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ paddingTop: 8, borderTop: '1px solid var(--app-border)' }}>
        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={() => addRows(1)}>+ 1 dòng</Button>
          <Button icon={<PlusCircleOutlined />} onClick={() => addRows(5)}>+ 5 dòng</Button>
          <Button icon={<ThunderboltOutlined />} onClick={handleAutoNumber}>Đánh mã lại</Button>
          <Button icon={<ClearOutlined />} onClick={() => setItems((p) => p.filter((x) => x.name.trim() !== ''))}>
            Dọn dòng trống
          </Button>
          <Select
            size="small"
            placeholder="Mức chung..."
            style={{ width: 110 }}
            options={IMPACT_LEVELS.map((l) => ({ value: l, label: `Mức ${l}` }))}
            onChange={(val) => setItems((p) => p.map((x) => ({ ...x, baseImpact: val })))}
          />
          <Button icon={<FileTextOutlined />} onClick={() => setShowPasteBox(!showPasteBox)}>
            {showPasteBox ? 'Đóng dán' : 'Dán nhanh'}
          </Button>
        </Space>
        <Space>
          <Button onClick={onClose}>Huỷ bỏ</Button>
          <Button type="primary" loading={batchSave.isPending} disabled={validCount === 0} onClick={handleSave}>
            Lưu {validCount} tiêu chí
          </Button>
        </Space>
      </Flex>
    </Flex>
  )
}

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
