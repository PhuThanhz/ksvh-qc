import { Button } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { CriteriaExcelActions } from '@/features/criteria/components/CriteriaExcelActions'
import { CriterionFormModal } from '@/features/criteria/components/CriterionFormModal'
import { CriterionTab } from '@/features/criteria/components/CriterionTab'
import type { Criterion } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

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
      title="Tiêu chí kiểm soát"
      subtitle="Danh mục tiêu chí kiểm soát chi tiết, phương pháp đánh giá, mức độ ảnh hưởng cơ sở và mẫu phiếu kiểm tra áp dụng"
      headerExtra={<CriteriaExcelActions />}
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          {/* Một nút duy nhất: trong modal chọn thêm một tiêu chí hoặc nhiều tiêu chí cùng lúc. */}
          <Button
            type="primary"
            onClick={() => setCriterionModal({ open: true, defaultGroupId: initialGroupId })}
          >
            Thêm tiêu chí
          </Button>
        </ProtectedAction>
      }
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
