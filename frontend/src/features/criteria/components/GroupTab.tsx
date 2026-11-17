import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Select } from 'antd'
import { useMemo, useState } from 'react'
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
  onEditCriterion?: (criterion: Criterion) => void
}

export function GroupTab({ onAddCriterionToGroup, onEditCriterion }: GroupTabProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined)
  const groups = useCriterionGroups(selectedCompanyId)
  const companies = useCompanies({ page: 0, size: 100, active: true })

  // State điều khiển các modal
  const [formModal, setFormModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [detailModal, setDetailModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
  const [viewingCriterion, setViewingCriterion] = useState<Criterion | undefined>(undefined)

  const nextOrder = Math.max(0, ...(groups.data ?? []).map((g) => g.sortOrder)) + 1

  const companyFilterOptions = useMemo(() => {
    return (companies.data?.items ?? []).map((c) => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }))
  }, [companies.data])

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Flex align="center" gap={12}>
            <span style={{ color: '#595959', fontSize: 13 }}>Lọc theo công ty:</span>
            <Select
              allowClear
              placeholder="Tất cả công ty & dùng chung"
              style={{ width: 280 }}
              value={selectedCompanyId}
              onChange={(val) => setSelectedCompanyId(val)}
              options={companyFilterOptions}
              loading={companies.isLoading}
            />
          </Flex>
          <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormModal({ open: true })}>
              Thêm nhóm tiêu chí
            </Button>
          </ProtectedAction>
        </Flex>

        <GroupTable
          groups={groups.data}
          loading={groups.isFetching}
          onEdit={(group) => setFormModal({ open: true, group })}
          onAddCriterion={onAddCriterionToGroup}
          onViewCriteria={(group) => setDetailModal({ open: true, group })}
        />
      </Flex>

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
        onViewCriterion={(criterion) => setViewingCriterion(criterion)}
        onEditCriterion={onEditCriterion}
      />

      {/* Modal xem chi tiết tiêu chí nhỏ khi người dùng bấm vào tiêu chí trong nhóm */}
      <CriterionDetailModal
        open={Boolean(viewingCriterion)}
        criterion={viewingCriterion}
        onClose={() => setViewingCriterion(undefined)}
        onEdit={(criterion) => {
          setViewingCriterion(undefined)
          onEditCriterion?.(criterion)
        }}
      />
    </Card>
  )
}
