import { AppstoreOutlined, DownOutlined, FileTextOutlined } from '@ant-design/icons'
import { Alert, Flex, Modal, Segmented, Select, Tag } from 'antd'
import { useMemo, useState } from 'react'
import type { CriterionGroup, Template } from '@/features/criteria/criteria.types'
import { SurpriseCriteriaPicker } from '@/features/inspections/components/SurpriseCriteriaPicker'

export interface PlanSurpriseScopeCellProps {
  restaurantName?: string
  /** Chuyên đề được phép với nhà hàng (đã lọc theo công ty). */
  groups: CriterionGroup[]
  templates: Template[]
  templateId?: number | null
  topicGroupIds: number[]
  criterionIds: number[]
  onChange: (criterionIds: number[], topicGroupIds: number[], templateId?: number | null) => void
}

/**
 * Ô phạm vi kiểm tra đột xuất: Hỗ trợ chọn mẫu phiếu đột xuất có sẵn
 * HOẶC tùy biến theo từng chuyên đề / bốc chọn tiêu chí con.
 */
export function PlanSurpriseScopeCell({
  restaurantName,
  groups,
  templates,
  templateId,
  topicGroupIds,
  criterionIds,
  onChange,
}: PlanSurpriseScopeCellProps) {
  const [open, setOpen] = useState(false)
  const initialMode = templateId ? 'TEMPLATE' : 'TOPICS'
  const [mode, setMode] = useState<'TEMPLATE' | 'TOPICS'>(initialMode)
  const [selectedTplId, setSelectedTplId] = useState<number | null>(templateId ?? null)
  const [draft, setDraft] = useState<{ criterionIds: number[]; topicGroupIds: number[] }>({
    criterionIds,
    topicGroupIds,
  })

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === (open ? selectedTplId : templateId)),
    [templates, open, selectedTplId, templateId],
  )

  const empty = !templateId && topicGroupIds.length === 0

  const openPicker = () => {
    setMode(templateId ? 'TEMPLATE' : 'TOPICS')
    setSelectedTplId(templateId ?? null)
    setDraft({ criterionIds, topicGroupIds })
    setOpen(true)
  }

  const handleOk = () => {
    if (mode === 'TEMPLATE') {
      onChange([], [], selectedTplId)
    } else {
      onChange(draft.criterionIds, draft.topicGroupIds, null)
    }
    setOpen(false)
  }

  const templateOptions = useMemo(() => {
    return templates.map((t) => {
      const isSurprise = t.inspectionType === 'SURPRISE' || t.inspectionType?.toLowerCase().includes('đột')
      return {
        value: t.id,
        label: `${isSurprise ? '[Đột xuất] ' : ''}${t.code} – ${t.name} (${t.criterionCount} tiêu chí)`,
      }
    })
  }, [templates])

  const canApply = mode === 'TEMPLATE' ? selectedTplId !== null : draft.topicGroupIds.length > 0

  return (
    <>
      <button type="button" className={`plan-scope${empty ? ' is-empty' : ''}`} onClick={openPicker}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {empty ? (
            'Chọn mẫu hoặc chuyên đề'
          ) : templateId ? (
            <>
              <Tag color="orange" style={{ margin: 0, fontWeight: 600 }}>
                Mẫu
              </Tag>
              <span>{selectedTemplate?.name ?? `Mẫu #${templateId}`}</span>
            </>
          ) : (
            `${topicGroupIds.length} chuyên đề · ${criterionIds.length > 0 ? `${criterionIds.length} tiêu chí` : 'toàn bộ'}`
          )}
        </span>
        <DownOutlined />
      </button>

      <Modal
        open={open}
        width={760}
        title={`Phạm vi kiểm tra đột xuất${restaurantName ? ` – ${restaurantName}` : ''}`}
        okText="Áp dụng"
        cancelText="Huỷ"
        okButtonProps={{ disabled: !canApply }}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Flex vertical gap={16} style={{ marginTop: 8 }}>
          <Segmented
            block
            size="large"
            value={mode}
            onChange={(val) => setMode(val as 'TEMPLATE' | 'TOPICS')}
            options={[
              {
                value: 'TEMPLATE',
                label: 'Chọn Mẫu phiếu có sẵn',
                icon: <FileTextOutlined />,
              },
              {
                value: 'TOPICS',
                label: 'Tùy biến Chuyên đề & Tiêu chí',
                icon: <AppstoreOutlined />,
              },
            ]}
          />

          {mode === 'TEMPLATE' ? (
            <Flex vertical gap={12} style={{ padding: '8px 0' }}>
              <Alert
                type="info"
                showIcon
                message="Kiểm tra đột xuất theo mẫu phiếu chuẩn hóa"
                description="Chọn một mẫu phiếu đã được xây dựng sẵn tiêu chí trọng tâm (ví dụ: Mẫu đột xuất ATTP, Mẫu đột xuất PCCC...)."
              />
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Mẫu phiếu áp dụng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn mẫu phiếu kiểm tra đột xuất..."
                  style={{ width: '100%' }}
                  value={selectedTplId}
                  onChange={(val) => setSelectedTplId(val)}
                  options={templateOptions}
                />
              </div>

              {selectedTemplate && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedTemplate.code} – {selectedTemplate.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Số lượng: <b>{selectedTemplate.criterionCount}</b> tiêu chí kiểm soát · Công ty:{' '}
                    <b>{selectedTemplate.companyName ?? 'Dùng chung'}</b>
                  </div>
                </div>
              )}
            </Flex>
          ) : (
            <SurpriseCriteriaPicker
              groups={groups}
              selectedGroupIds={draft.topicGroupIds}
              selectedCriterionIds={draft.criterionIds}
              onChange={(cIds, gIds) => setDraft({ criterionIds: cIds, topicGroupIds: gIds })}
            />
          )}
        </Flex>
      </Modal>
    </>
  )
}
