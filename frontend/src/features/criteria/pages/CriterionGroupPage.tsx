import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'
import { CriterionFormModal } from '@/features/criteria/components/CriterionFormModal'
import { GroupTab } from '@/features/criteria/components/GroupTab'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { CriteriaExcelActions } from '@/features/criteria/components/CriteriaExcelActions'

export function CriterionGroupPage() {
  const navigate = useNavigate()
  const groups = useCriterionGroups()
  const [criterionModal, setCriterionModal] = useState<{
    open: boolean
    defaultGroupId?: number
  }>({ open: false })

  const handleSelectGroup = (groupId: number) => {
    navigate(`${ROUTES.admin.criteria}?groupId=${groupId}`)
  }

  const handleAddCriterionToGroup = (group: CriterionGroup) => {
    setCriterionModal({ open: true, defaultGroupId: group.id })
  }

  return (
    <PageContainer
      title="Nhóm tiêu chí"
      subtitle="Quản lý các nhóm đánh giá lớn (Vệ sinh, Kho hàng, Quy trình, Chất lượng...) và phân bổ tiêu chí con"
      extra={<CriteriaExcelActions />}
    >
      <GroupTab
        onSelectGroup={handleSelectGroup}
        onAddCriterionToGroup={handleAddCriterionToGroup}
      />
      <CriterionFormModal
        open={criterionModal.open}
        groups={groups.data ?? []}
        defaultGroupId={criterionModal.defaultGroupId}
        onClose={() => setCriterionModal({ open: false })}
      />
    </PageContainer>
  )
}

