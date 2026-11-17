import { PlusOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Select, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { BatchCriterionModal } from '@/features/criteria/components/BatchCriterionModal'
import { CriterionDetailModal } from '@/features/criteria/components/CriterionDetailModal'
import { GroupDetailModal } from '@/features/criteria/components/GroupDetailModal'
import { GroupFormModal } from '@/features/criteria/components/GroupFormModal'
import { GroupTable } from '@/features/criteria/components/GroupTable'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export interface GroupTabProps {
  onSelectGroup: (groupId: number) => void
  onAddCriterionToGroup: (group: CriterionGroup) => void
  onBatchAddCriteriaToGroup?: (group: CriterionGroup) => void
  onEditCriterion?: (criterion: Criterion) => void
}

export function GroupTab({ onAddCriterionToGroup, onBatchAddCriteriaToGroup, onEditCriterion }: GroupTabProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const groups = useCriterionGroups(selectedCompanyId)
  const companies = useCompanies({ page: 0, size: 100, active: true })

  // State điều khiển các modal
  const [formModal, setFormModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [detailModal, setDetailModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [batchModal, setBatchModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [viewingCriterion, setViewingCriterion] = useState<Criterion | undefined>(undefined)

  const handleOpenBatch = (group: CriterionGroup) => {
    if (onBatchAddCriteriaToGroup) {
      onBatchAddCriteriaToGroup(group)
    } else {
      setBatchModal({ open: true, group })
    }
  }

  const nextOrder = Math.max(0, ...(groups.data ?? []).map((g) => g.sortOrder)) + 1

  const companyFilterOptions = useMemo(() => {
    return (companies.data?.items ?? []).map((c) => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }))
  }, [companies.data])

  const filteredGroups = useMemo(() => {
    const list = groups.data ?? []
    if (!keyword.trim()) return list
    const q = keyword.trim().toLowerCase()
    return list.filter(
      (g) =>
        g.code.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        (g.companyName && g.companyName.toLowerCase().includes(q)),
    )
  }, [groups.data, keyword])

  const stats = useMemo(() => {
    const list = groups.data ?? []
    const total = list.length
    const totalCriteria = list.reduce((sum, g) => sum + (g.criterionCount ?? 0), 0)
    const emptyCount = list.filter((g) => !g.criterionCount).length
    return { total, totalCriteria, emptyCount }
  }, [groups.data])

  return (
    <Flex vertical gap={16}>
      <AdvancedFilter
        search={{ value: keyword, placeholder: 'Tìm theo mã hoặc tên nhóm...', maxWidth: 260, onSearch: setKeyword }}
        extra={
          <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormModal({ open: true })}>
              Thêm nhóm tiêu chí
            </Button>
          </ProtectedAction>
        }
      >
        <Select
          allowClear
          placeholder="Tất cả công ty & dùng chung"
          style={{ width: 260 }}
          value={selectedCompanyId}
          onChange={(val) => setSelectedCompanyId(val)}
          options={companyFilterOptions}
          loading={companies.isLoading}
        />
        <Flex wrap gap={8} align="center" style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
          <span className="app-stat-chip">
            Tổng: <strong style={{ color: 'var(--app-text)' }}>{stats.total}</strong> nhóm
          </span>
          <span className="app-stat-chip">
            Tổng: <strong style={{ color: 'var(--app-text)' }}>{stats.totalCriteria}</strong> tiêu chí
          </span>
          {stats.emptyCount > 0 && (
            <Tag color="warning" style={{ margin: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Badge status="warning" /> {stats.emptyCount} nhóm chưa có tiêu chí
            </Tag>
          )}
        </Flex>
      </AdvancedFilter>

      <GroupTable
        groups={filteredGroups}
        loading={groups.isFetching}
        onEdit={(group) => setFormModal({ open: true, group })}
        onAddCriterion={onAddCriterionToGroup}
        onBatchAddCriteria={handleOpenBatch}
        onViewCriteria={(group) => setDetailModal({ open: true, group })}
      />

      {/* Modal tạo / sửa nhóm */}
      <GroupFormModal
        open={formModal.open}
        group={formModal.group}
        nextOrder={nextOrder}
        onClose={() => setFormModal({ open: false })}
      />

      {/* Modal xem chi tiết nhóm và danh sách tiêu chí nhỏ */}
      <GroupDetailModal
        open={detailModal.open}
        group={detailModal.group}
        onClose={() => setDetailModal({ open: false })}
        onEditGroup={(group) => setFormModal({ open: true, group })}
        onAddCriterion={onAddCriterionToGroup}
        onBatchAddCriteria={handleOpenBatch}
        onViewCriterion={(criterion) => setViewingCriterion(criterion)}
        onEditCriterion={onEditCriterion}
      />

      {/* Modal thêm nhanh nhiều tiêu chí con vào nhóm */}
      <BatchCriterionModal
        open={batchModal.open}
        group={batchModal.group}
        groups={groups.data}
        onClose={() => setBatchModal({ open: false, group: undefined })}
      />

      {/* Modal xem chi tiết tiêu chí nhỏ */}
      <CriterionDetailModal
        open={Boolean(viewingCriterion)}
        criterion={viewingCriterion}
        onClose={() => setViewingCriterion(undefined)}
        onEdit={(criterion) => {
          setViewingCriterion(undefined)
          onEditCriterion?.(criterion)
        }}
      />
    </Flex>
  )
}
