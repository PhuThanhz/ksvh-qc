import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { CriterionFormModal } from '@/features/criteria/components/CriterionFormModal'
import { CriterionTab } from '@/features/criteria/components/CriterionTab'
import type { Criterion } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { CriteriaExcelActions } from '@/features/criteria/components/CriteriaExcelActions'

export function CriteriaPage() {
  const [searchParams] = useSearchParams()
  const groupIdParam = searchParams.get('groupId')
  const initialGroupId = groupIdParam ? Number(groupIdParam) : undefined

  const [criterionModal, setCriterionModal] = useState<{
    open: boolean
    criterion?: Criterion
    defaultGroupId?: number
  }>({ open: false })

  const groups = useCriterionGroups()

  return (
    <PageContainer
      title="Tiêu chí đánh giá"
      subtitle="Danh sách các tiêu chí chấm điểm chi tiết, cách kiểm tra, mức ảnh hưởng 1–5 và mẫu phiếu áp dụng"
      extra={<CriteriaExcelActions />}
    >
      <CriterionTab
        key={`tab-${initialGroupId ?? 'all'}`}
        initialGroupId={initialGroupId}
        onCreateCriterion={(defaultGroupId) => setCriterionModal({ open: true, defaultGroupId })}
        onEditCriterion={(criterion) => setCriterionModal({ open: true, criterion })}
      />
      <CriterionFormModal
        open={criterionModal.open}
        criterion={criterionModal.criterion}
        groups={groups.data ?? []}
        defaultGroupId={criterionModal.defaultGroupId}
        onClose={() => setCriterionModal({ open: false })}
      />
    </PageContainer>
  )
}
