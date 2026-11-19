import { Badge, Flex, Select, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { CriterionDetailModal } from '@/features/criteria/components/CriterionDetailModal'
import { GroupDetailModal } from '@/features/criteria/components/GroupDetailModal'
import { GroupFormModal } from '@/features/criteria/components/GroupFormModal'
import { GroupTable } from '@/features/criteria/components/GroupTable'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriterionGroups, useDeleteCriterionGroup } from '@/features/criteria/hooks/useCriteria'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { getErrorMessage } from '@/lib/http'

export interface GroupTabProps {
  onSelectGroup: (groupId: number) => void
  onAddCriterionToGroup: (group: CriterionGroup) => void
  onEditCriterion?: (criterion: Criterion) => void
  createOpen?: boolean
  onCreateClose?: () => void
}

export function GroupTab({
  onAddCriterionToGroup,
  onEditCriterion,
  createOpen,
  onCreateClose,
}: GroupTabProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const groups = useCriterionGroups(selectedCompanyId)
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const confirm = useConfirm()
  const notify = useNotify()
  const removeGroup = useDeleteCriterionGroup()

  // State điều khiển các modal
  const [formModal, setFormModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [detailModal, setDetailModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [viewingCriterion, setViewingCriterion] = useState<Criterion | undefined>(undefined)

  const isFormOpen = createOpen || formModal.open

  const handleCloseForm = () => {
    setFormModal({ open: false })
    onCreateClose?.()
  }

  const handleDeleteGroup = async (group: CriterionGroup) => {
    if (group.criterionCount && group.criterionCount > 0) {
      notify.error(
        `Nhóm tiêu chí "${group.name}" đang chứa ${group.criterionCount} tiêu chí. Vui lòng di chuyển hoặc xoá các tiêu chí này trước khi xoá nhóm.`,
      )
      return
    }
    const ok = await confirm({
      title: `Xoá nhóm tiêu chí "${group.name}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    removeGroup.mutate(group.id, {
      onSuccess: () => notify.success('Đã xoá nhóm tiêu chí'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
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
        search={{ value: keyword, placeholder: 'Tìm theo mã hoặc tên nhóm...', onSearch: setKeyword }}
        activeCount={selectedCompanyId ? 1 : 0}
        onReset={() => {
          setKeyword('')
          setSelectedCompanyId(undefined)
        }}
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
        onViewCriteria={(group) => setDetailModal({ open: true, group })}
        onDelete={handleDeleteGroup}
      />

      {/* Modal tạo / sửa nhóm */}
      <GroupFormModal
        open={isFormOpen}
        group={formModal.group}
        nextOrder={nextOrder}
        onClose={handleCloseForm}
      />

      {/* Modal xem chi tiết nhóm và danh sách tiêu chí nhỏ */}
      <GroupDetailModal
        open={detailModal.open}
        group={detailModal.group}
        onClose={() => setDetailModal({ open: false })}
        onEditGroup={(group) => setFormModal({ open: true, group })}
        onAddCriterion={onAddCriterionToGroup}
        onViewCriterion={(criterion) => setViewingCriterion(criterion)}
        onEditCriterion={onEditCriterion}
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
