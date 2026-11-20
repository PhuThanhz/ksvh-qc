import { Button } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'
import { CriteriaExcelActions } from '@/features/criteria/components/CriteriaExcelActions'
import { CriterionFormModal } from '@/features/criteria/components/CriterionFormModal'
import { GroupTab } from '@/features/criteria/components/GroupTab'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function CriterionGroupPage() {
  const navigate = useNavigate()
  const groups = useCriterionGroups()
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [criterionModal, setCriterionModal] = useState<{
    open: boolean
    defaultGroupId?: number
    criterion?: Criterion
  }>({ open: false })

  const handleSelectGroup = (groupId: number) => {
    navigate(`${ROUTES.admin.criteria}?groupId=${groupId}`)
  }

  const handleAddCriterionToGroup = (group: CriterionGroup) => {
    setCriterionModal({ open: true, defaultGroupId: group.id, criterion: undefined })
  }

  const handleEditCriterion = (criterion: Criterion) => {
    setCriterionModal({ open: true, defaultGroupId: criterion.groupId, criterion })
  }

  return (
    <PageContainer
      title="Nhóm tiêu chí kiểm soát"
      subtitle="Quản lý các nhóm tiêu chí vận hành (Vệ sinh VSATTP, Cơ sở vật chất, Quy trình phục vụ...) và danh mục tiêu chí"
      headerExtra={<CriteriaExcelActions />}
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button type="primary" onClick={() => setCreateGroupOpen(true)}>
            Thêm nhóm tiêu chí
          </Button>
        </ProtectedAction>
      }
    >
      <GroupTab
        createOpen={createGroupOpen}
        onCreateClose={() => setCreateGroupOpen(false)}
        onSelectGroup={handleSelectGroup}
        onAddCriterionToGroup={handleAddCriterionToGroup}
        onEditCriterion={handleEditCriterion}
        onGroupCreated={(newGroup) => setCriterionModal({ open: true, defaultGroupId: newGroup.id, criterion: undefined })}
      />
      <CriterionFormModal
        open={criterionModal.open}
        criterion={criterionModal.criterion}
        groups={groups.data ?? []}
        defaultGroupId={criterionModal.defaultGroupId}
        onClose={() => setCriterionModal({ open: false, criterion: undefined })}
      />
    </PageContainer>
  )
}
