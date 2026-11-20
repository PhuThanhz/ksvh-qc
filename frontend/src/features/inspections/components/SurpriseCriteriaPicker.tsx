import {
  CheckOutlined,
  CloseOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Empty, Flex, Input, Spin, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriteriaList } from '@/features/criteria/hooks/useCriteria'

export interface SurpriseCriteriaPickerProps {
  groups: CriterionGroup[]
  selectedGroupIds?: number[]
  selectedCriterionIds?: number[]
  onChange: (criterionIds: number[], topicGroupIds: number[]) => void
}

/**
 * Bộ chọn phạm vi kiểm tra đột xuất chuẩn Apple:
 * Hiển thị rõ ràng từng nhóm chuyên đề VÀ toàn bộ các tiêu chí nhỏ bên trong.
 * Cho phép chọn nhanh theo cả nhóm hoặc tích chọn chi tiết từng tiêu chí con.
 */
export function SurpriseCriteriaPicker({
  groups,
  selectedGroupIds = [],
  selectedCriterionIds = [],
  onChange,
}: SurpriseCriteriaPickerProps) {
  const [keyword, setKeyword] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

  // Lấy toàn bộ tiêu chí đang hoạt động
  const { data: criteriaData, isLoading } = useCriteriaList({
    page: 0,
    size: 500,
    active: true,
  })

  const allCriteria = useMemo(() => criteriaData?.items ?? [], [criteriaData?.items])
  const activeGroups = useMemo(() => groups.filter((g) => g.active), [groups])

  // Nếu ban đầu truyền vào selectedGroupIds mà selectedCriterionIds rỗng thì tự động tích chọn các tiêu chí của nhóm đó
  useEffect(() => {
    if (selectedCriterionIds.length === 0 && selectedGroupIds.length > 0 && allCriteria.length > 0) {
      const gSet = new Set(selectedGroupIds)
      const matched = allCriteria.filter((c) => c.groupId && gSet.has(c.groupId)).map((c) => c.id)
      if (matched.length > 0) {
        onChange(matched, selectedGroupIds)
      }
    }
  }, [allCriteria, selectedGroupIds, selectedCriterionIds, onChange])

  // Phân nhóm tiêu chí theo groupId
  const criteriaByGroup = useMemo(() => {
    const map = new Map<number, Criterion[]>()
    for (const c of allCriteria) {
      if (!c.groupId) continue
      const list = map.get(c.groupId) ?? []
      list.push(c)
      map.set(c.groupId, list)
    }
    return map
  }, [allCriteria])

  // Tự động mở rộng các nhóm đang có tiêu chí được chọn hoặc khi tìm kiếm
  useEffect(() => {
    if (activeGroups.length === 0) return
    const next: Record<number, boolean> = {}
    for (const g of activeGroups) {
      const gCrits = criteriaByGroup.get(g.id) ?? []
      const hasSelected = gCrits.some((c) => selectedCriterionIds.includes(c.id))
      // Nếu có tìm kiếm thì mở tất cả nhóm có kết quả
      next[g.id] = hasSelected || Boolean(keyword.trim())
    }
    setExpandedGroups(next)
  }, [activeGroups, keyword, criteriaByGroup, selectedCriterionIds])

  // Lọc tiêu chí theo từ khoá tìm kiếm
  const filteredCriteriaByGroup = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const map = new Map<number, Criterion[]>()
    for (const g of activeGroups) {
      const list = criteriaByGroup.get(g.id) ?? []
      if (!q) {
        map.set(g.id, list)
      } else {
        const matched = list.filter(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            (c.checkMethod && c.checkMethod.toLowerCase().includes(q)),
        )
        map.set(g.id, matched)
      }
    }
    return map
  }, [activeGroups, criteriaByGroup, keyword])

  const selectedSet = useMemo(() => new Set(selectedCriterionIds), [selectedCriterionIds])

  // Bật/tắt 1 tiêu chí con
  const toggleCriterion = (criterionId: number) => {
    const nextSet = new Set(selectedSet)
    if (nextSet.has(criterionId)) {
      nextSet.delete(criterionId)
    } else {
      nextSet.add(criterionId)
    }
    const nextCriterionIds = Array.from(nextSet)
    // Tính lại topicGroupIds dựa trên các tiêu chí đang được chọn
    const nextGroupIds = activeGroups
      .filter((g) => {
        const gCrits = criteriaByGroup.get(g.id) ?? []
        return gCrits.some((c) => nextSet.has(c.id))
      })
      .map((g) => g.id)

    onChange(nextCriterionIds, nextGroupIds)
  }

  // Bật/tắt toàn bộ tiêu chí trong 1 nhóm
  const toggleGroup = (groupId: number, checkAll: boolean) => {
    const gCrits = criteriaByGroup.get(groupId) ?? []
    const gCritIds = gCrits.map((c) => c.id)
    const nextSet = new Set(selectedSet)

    if (checkAll) {
      for (const id of gCritIds) nextSet.add(id)
    } else {
      for (const id of gCritIds) nextSet.delete(id)
    }

    const nextCriterionIds = Array.from(nextSet)
    const nextGroupIds = activeGroups
      .filter((g) => {
        const crits = criteriaByGroup.get(g.id) ?? []
        return crits.some((c) => nextSet.has(c.id))
      })
      .map((g) => g.id)

    onChange(nextCriterionIds, nextGroupIds)
  }

  // Chọn tất cả tiêu chí
  const selectAll = () => {
    const allIds = allCriteria.map((c) => c.id)
    const allGroupIds = activeGroups.map((g) => g.id)
    onChange(allIds, allGroupIds)
  }

  // Bỏ chọn tất cả
  const clearAll = () => {
    onChange([], [])
  }

  const toggleExpand = (groupId: number) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const expandAll = (open: boolean) => {
    const next: Record<number, boolean> = {}
    for (const g of activeGroups) next[g.id] = open
    setExpandedGroups(next)
  }

  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(15, 23, 42, 0.12)',
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Thanh công cụ tìm kiếm và thao tác nhanh */}
      <div
        style={{
          padding: '12px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo mã hoặc tên tiêu chí kiểm soát..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 280, borderRadius: 8 }}
          />

          <Flex align="center" gap={8} wrap="wrap">
            <Button size="small" htmlType="button" onClick={selectAll} icon={<CheckOutlined />}>
              Chọn tất cả ({allCriteria.length})
            </Button>
            <Button size="small" htmlType="button" onClick={clearAll} icon={<CloseOutlined />}>
              Bỏ chọn tất cả
            </Button>
            <Button
              size="small"
              type="text"
              htmlType="button"
              onClick={() => expandAll(!Object.values(expandedGroups).some(Boolean))}
            >
              {Object.values(expandedGroups).some(Boolean) ? 'Thu gọn' : 'Mở rộng tất cả'}
            </Button>
            <Tag
              style={{
                margin: 0,
                padding: '2px 8px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 12,
                color: selectedSet.size > 0 ? '#0f172a' : '#64748b',
                background: selectedSet.size > 0 ? '#e2e8f0' : '#f1f5f9',
                border: 'none',
              }}
            >
              Đã chọn: {selectedSet.size} / {allCriteria.length} tiêu chí
            </Tag>
          </Flex>
        </Flex>
      </div>

      {/* Danh sách nhóm và tiêu chí con */}
      <div style={{ maxHeight: 420, overflowY: 'auto', padding: '10px 14px' }}>
        {isLoading ? (
          <Flex justify="center" align="center" style={{ padding: 40 }}>
            <Spin tip="Đang tải danh mục tiêu chí..." />
          </Flex>
        ) : activeGroups.length === 0 ? (
          <Empty description="Không có nhóm tiêu chí nào" />
        ) : (
          <Flex vertical gap={10}>
            {activeGroups.map((group) => {
              const groupCriteria = filteredCriteriaByGroup.get(group.id) ?? []
              const allGroupCriteria = criteriaByGroup.get(group.id) ?? []
              if (allGroupCriteria.length === 0 && keyword.trim()) return null

              const selectedInGroup = allGroupCriteria.filter((c) => selectedSet.has(c.id)).length
              const allChecked = allGroupCriteria.length > 0 && selectedInGroup === allGroupCriteria.length
              const indeterminate = selectedInGroup > 0 && selectedInGroup < allGroupCriteria.length
              const isExpanded = expandedGroups[group.id] ?? false

              return (
                <div
                  key={group.id}
                  style={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    overflow: 'hidden',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {/* Tiêu đề nhóm tiêu chí */}
                  <div
                    style={{
                      padding: '10px 14px',
                      background: selectedInGroup > 0 ? '#f8fafc' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none',
                    }}
                    onClick={() => toggleExpand(group.id)}
                  >
                    <Flex align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          transition: 'transform 0.16s ease',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}
                      >
                        <RightOutlined />
                      </span>

                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Checkbox
                          checked={allChecked}
                          indeterminate={indeterminate}
                          onChange={(e) => toggleGroup(group.id, e.target.checked)}
                        />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 650, color: '#0f172a', fontSize: 13.5 }}>
                          {group.name}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                          ({group.code})
                        </span>
                      </div>
                    </Flex>

                    <Flex align="center" gap={8}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: selectedInGroup > 0 ? '#0f172a' : '#64748b',
                          background: selectedInGroup > 0 ? '#f1f5f9' : 'transparent',
                          padding: '1px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {selectedInGroup} / {allGroupCriteria.length} tiêu chí
                      </span>
                    </Flex>
                  </div>

                  {/* Danh sách các tiêu chí nhỏ bên trong nhóm */}
                  {isExpanded && (
                    <div style={{ padding: '6px 12px 10px', background: '#fafbfc' }}>
                      {groupCriteria.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12.5 }}>
                          {keyword.trim()
                            ? 'Không tìm thấy tiêu chí nào khớp từ khoá trong nhóm này'
                            : 'Nhóm này chưa có tiêu chí'}
                        </div>
                      ) : (
                        <Flex vertical gap={6}>
                          {groupCriteria.map((c) => {
                            const isChecked = selectedSet.has(c.id)
                            return (
                              <div
                                key={c.id}
                                onClick={() => toggleCriterion(c.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  background: isChecked ? '#ffffff' : 'transparent',
                                  border: isChecked ? '1px solid #cbd5e1' : '1px solid transparent',
                                  boxShadow: isChecked ? '0 1px 2px rgba(15, 23, 42, 0.04)' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.12s ease',
                                }}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => toggleCriterion(c.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ marginTop: 2 }}
                                />

                                <div style={{ minWidth: 0, flex: 1, lineHeight: 1.35 }}>
                                  <Flex align="center" gap={8} wrap="wrap">
                                    <span className="code-tag--blue">{c.code}</span>
                                    <span
                                      style={{
                                        fontSize: 13,
                                        fontWeight: isChecked ? 600 : 500,
                                        color: isChecked ? '#0f172a' : '#334155',
                                      }}
                                    >
                                      {c.name}
                                    </span>
                                  </Flex>
                                  {c.checkMethod && (
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        color: '#64748b',
                                        marginTop: 3,
                                      }}
                                    >
                                      {c.checkMethod}
                                    </div>
                                  )}
                                </div>

                                <div style={{ flexShrink: 0 }}>
                                  <ImpactTag value={c.baseImpact} />
                                </div>
                              </div>
                            )
                          })}
                        </Flex>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </Flex>
        )}
      </div>
    </div>
  )
}
