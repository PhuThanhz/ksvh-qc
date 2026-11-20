import { UnorderedListOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Select, Spin, Typography } from 'antd'
import { useState } from 'react'
import { DetailDrawer } from '@/components/feedback/detail'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { useBatchCriterionEditor } from '@/features/criteria/hooks/useBatchCriterionEditor'
import { BatchCriterionList } from './BatchCriterionList'
import { BatchPasteBox } from './BatchPasteBox'
import { BatchToolbar } from './BatchToolbar'

export interface CriterionBatchModalProps {
  open: boolean
  groups: readonly CriterionGroup[]
  defaultGroupId?: number | null
  /** Ghi chú đầu danh sách, vd khi vừa tạo nhóm. */
  hint?: string
  onClose: () => void
}

/**
 * Thêm tiêu chí (một hoặc nhiều) vào một nhóm, trong drawer dùng chung trượt từ dưới lên.
 * Mỗi lần mở là một phiên nhập mới: đóng xong thì làm mới danh sách.
 */
export function CriterionBatchModal(props: CriterionBatchModalProps) {
  const [session, setSession] = useState(0)
  return <BatchDrawer key={session} {...props} afterClose={() => setSession((s) => s + 1)} />
}

function BatchDrawer({ open, groups, defaultGroupId, hint, onClose, afterClose }: CriterionBatchModalProps & { afterClose: () => void }) {
  const active = groups.filter((g) => g.active)
  const [picked, setPicked] = useState<number>()
  const groupId = picked ?? (active.some((g) => g.id === defaultGroupId) ? defaultGroupId ?? undefined : active[0]?.id)
  const group = active.find((g) => g.id === groupId)
  const editor = useBatchCriterionEditor(group, onClose)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      afterClose={afterClose}
      fit
      maskClosable={false}
      closeText="Huỷ"
      icon={<UnorderedListOutlined />}
      title="Thêm tiêu chí"
      subtitle={
        <Flex align="center" gap={6} wrap className="batch-drawer__group">
          <span>vào nhóm</span>
          <Select
            size="small"
            value={groupId}
            onChange={setPicked}
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Chọn nhóm"
            popupMatchSelectWidth={false}
            options={active.map((g) => ({ value: g.id, label: g.name }))}
            className="batch-drawer__group-select"
          />
          {group && (
            <span>· đang có {group.criterionCount} tiêu chí · {group.companyName ?? 'dùng chung mọi công ty'}</span>
          )}
        </Flex>
      }
      footerNote={<span className="batch-drawer__code">{editor.codeNote}</span>}
      actions={
        <Button type="primary" loading={editor.saving} disabled={!group || editor.filledCount === 0} onClick={() => void editor.save()}>
          {editor.filledCount > 1 ? `Thêm ${editor.filledCount} tiêu chí` : 'Thêm tiêu chí'}
        </Button>
      }
    >
      {hint && <Alert type="info" showIcon title={hint} />}
      {active.length === 0 ? (
        <Typography.Text type="secondary">Chưa có nhóm tiêu chí đang hoạt động. Hãy tạo nhóm trước.</Typography.Text>
      ) : editor.loadingCodes ? (
        <Flex justify="center" style={{ padding: 48 }}><Spin /></Flex>
      ) : (
        <div className="batch-drawer">
          <BatchToolbar
            count={editor.filledCount}
            pasteOpen={pasteOpen}
            onTogglePaste={() => setPasteOpen((v) => !v)}
            onApplyImpact={editor.applyImpact}
            onClearEmpty={editor.clearEmpty}
          />
          {pasteOpen && (
            <BatchPasteBox
              pasteText={pasteText}
              onChangeText={setPasteText}
              onClose={() => setPasteOpen(false)}
              onApply={(mode) => {
                editor.applyPaste(pasteText, mode)
                setPasteText('')
                setPasteOpen(false)
              }}
            />
          )}
          <BatchCriterionList
            items={editor.items}
            onUpdateItem={editor.update}
            onRemoveItem={editor.remove}
            onEnterNext={(i) => editor.focusRow(i + 1)}
            onAddRow={() => editor.focusRow(editor.items.length)}
          />
        </div>
      )}
    </DetailDrawer>
  )
}
