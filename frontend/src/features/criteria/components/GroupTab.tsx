import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Select } from 'antd'
import { useMemo, useState } from 'react'
import { GroupFormModal } from '@/features/criteria/components/GroupFormModal'
import { GroupTable } from '@/features/criteria/components/GroupTable'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export interface GroupTabProps {
  onSelectGroup: (groupId: number) => void
  onAddCriterionToGroup: (group: CriterionGroup) => void
}

export function GroupTab({ onSelectGroup, onAddCriterionToGroup }: GroupTabProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined)
  const groups = useCriterionGroups(selectedCompanyId)
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const [modal, setModal] = useState<{ open: boolean; group?: CriterionGroup }>({ open: false })
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true })}>
              Thêm nhóm tiêu chí
            </Button>
          </ProtectedAction>
        </Flex>
        <GroupTable
          groups={groups.data}
          loading={groups.isFetching}
          onEdit={(group) => setModal({ open: true, group })}
          onAddCriterion={onAddCriterionToGroup}
          onViewCriteria={(group) => onSelectGroup(group.id)}
        />
      </Flex>
      <GroupFormModal
        open={modal.open}
        group={modal.group}
        nextOrder={nextOrder}
        onClose={() => setModal({ open: false })}
      />
    </Card>
  )
}

