import { CloseOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Input, Select, Tooltip } from 'antd'
import { useState } from 'react'
import { IMPACT_DOT, IMPACT_NAME, type BatchItem } from './batchCriterion.types'

const IMPACT_OPTIONS = [1, 2, 3, 4, 5].map((v) => ({
  value: v,
  label: (
    <span className="impact-pill">
      <i style={{ background: IMPACT_DOT[v] }} />
      Mức {v}
      <em>{IMPACT_NAME[v]}</em>
    </span>
  ),
}))

export interface BatchCriterionListProps {
  items: BatchItem[]
  onUpdateItem: <K extends keyof BatchItem>(key: string, field: K, value: BatchItem[K]) => void
  onRemoveItem: (key: string) => void
  /** Enter ở ô nội dung: sang dòng kế tiếp (thêm dòng nếu đang ở dòng cuối). */
  onEnterNext: (index: number) => void
  onAddRow: () => void
}

/** Danh sách nhập tiêu chí: mỗi dòng một nội dung + mức ảnh hưởng; phương pháp / bằng chứng mở khi cần. */
export function BatchCriterionList({ items, onUpdateItem, onRemoveItem, onEnterNext, onAddRow }: BatchCriterionListProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="crit-list">
      {items.map((r, i) => {
        const expanded = open.has(r.key)
        const hasDetail = !!(r.checkMethod.trim() || r.evidenceRequired.trim())
        return (
          <div key={r.key} className={`crit-row${r.name.trim() ? ' is-filled' : ''}`}>
            <div className="crit-row__main">
              <span className="crit-row__num">{i + 1}</span>
              <Input.TextArea
                variant="borderless"
                autoSize={{ minRows: 1, maxRows: 4 }}
                value={r.name}
                data-batch-name={i}
                placeholder={i === 0 ? 'Nội dung tiêu chí, vd: Sàn bếp khô ráo, không đọng nước' : 'Nội dung tiêu chí'}
                className="crit-row__name"
                onChange={(e) => onUpdateItem(r.key, 'name', e.target.value)}
                onPressEnter={(e) => {
                  if (e.shiftKey) return
                  e.preventDefault()
                  onEnterNext(i)
                }}
              />
              <Select
                variant="borderless"
                size="small"
                value={r.baseImpact}
                options={IMPACT_OPTIONS}
                popupMatchSelectWidth={false}
                labelRender={({ value }) => (
                  <span className="impact-pill"><i style={{ background: IMPACT_DOT[Number(value)] }} />Mức {String(value)}</span>
                )}
                onChange={(v) => onUpdateItem(r.key, 'baseImpact', v)}
                className="crit-row__impact"
              />
              <button type="button" className={`crit-row__more${expanded || hasDetail ? ' is-on' : ''}`} onClick={() => toggle(r.key)}>
                Chi tiết <DownOutlined rotate={expanded ? 180 : 0} />
              </button>
              <Tooltip title="Xoá dòng">
                <Button type="text" size="small" icon={<CloseOutlined />} className="crit-row__remove" onClick={() => onRemoveItem(r.key)} aria-label="Xoá dòng" />
              </Tooltip>
            </div>
            {expanded && (
              <div className="crit-row__detail">
                <label>
                  <span>Phương pháp đánh giá</span>
                  <Input.TextArea variant="filled" autoFocus autoSize={{ minRows: 1, maxRows: 4 }} value={r.checkMethod}
                    placeholder="Cách kiểm tra, vd: Quan sát khu bếp giờ cao điểm"
                    onChange={(e) => onUpdateItem(r.key, 'checkMethod', e.target.value)} />
                </label>
                <label>
                  <span>Bằng chứng khi Không đạt</span>
                  <Input.TextArea variant="filled" autoSize={{ minRows: 1, maxRows: 4 }} value={r.evidenceRequired}
                    placeholder="Vd: Ảnh có thời gian, biên bản xác nhận của CHT"
                    onChange={(e) => onUpdateItem(r.key, 'evidenceRequired', e.target.value)} />
                </label>
              </div>
            )}
          </div>
        )
      })}
      <button type="button" className="crit-list__add" onClick={onAddRow}>
        <PlusOutlined /> Thêm tiêu chí <span>hoặc nhấn Enter</span>
      </button>
    </div>
  )
}
