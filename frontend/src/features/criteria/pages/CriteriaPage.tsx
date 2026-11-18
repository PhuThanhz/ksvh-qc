import { AppstoreAddOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons'
import { Dropdown, Space } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { useNotify } from '@/components/feedback/useNotify'
import { BatchCriterionModal } from '@/features/criteria/components/BatchCriterionModal'
import { CriteriaExcelActions } from '@/features/criteria/components/CriteriaExcelActions'
import { CriterionFormModal } from '@/features/criteria/components/CriterionFormModal'
import { CriterionTab } from '@/features/criteria/components/CriterionTab'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function CriteriaPage() {
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const groupIdParam = searchParams.get('groupId')
  const initialGroupId = groupIdParam ? Number(groupIdParam) : undefined

  const [criterionModal, setCriterionModal] = useState<{
    open: boolean
    criterion?: Criterion
    defaultGroupId?: number
  }>({ open: false })

  const [batchModal, setBatchModal] = useState<{
    open: boolean
    group?: CriterionGroup
  }>({ open: false })

  const groups = useCriterionGroups()

  const handleOpenBatch = (groupId?: number) => {
    const list = groups.data ?? []
    if (list.length === 0) {
      notify.warning('Chưa có nhóm tiêu chí nào. Vui lòng tạo nhóm tiêu chí trước!')
      return
    }
    const targetGroup = (groupId ? list.find((g) => g.id === groupId) : undefined) ?? list[0]
    setBatchModal({ open: true, group: targetGroup })
  }

  return (
    <PageContainer
      title="Tiêu chí đánh giá"
      subtitle="Danh sách các tiêu chí chấm điểm chi tiết, cách kiểm tra, mức ảnh hưởng 1–5 và mẫu phiếu áp dụng"
      extra={
        <Space size={8} wrap>
          <CriteriaExcelActions />
          <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
            <Dropdown.Button
              type="primary"
              icon={<DownOutlined />}
              onClick={() => setCriterionModal({ open: true, defaultGroupId: initialGroupId })}
              menu={{
                items: [
                  {
                    key: 'single',
                    icon: <PlusOutlined />,
                    label: 'Thêm 1 tiêu chí',
                    onClick: () => setCriterionModal({ open: true, defaultGroupId: initialGroupId }),
                  },
                  {
                    key: 'batch',
                    icon: <AppstoreAddOutlined />,
                    label: 'Thêm nhanh nhiều tiêu chí',
                    onClick: () => handleOpenBatch(initialGroupId),
                  },
                ],
              }}
            >
              <PlusOutlined /> Thêm tiêu chí
            </Dropdown.Button>
          </ProtectedAction>
        </Space>
      }
    >
      <CriterionTab
        key={`tab-${initialGroupId ?? 'all'}`}
        initialGroupId={initialGroupId}
        onCreateCriterion={(defaultGroupId) => setCriterionModal({ open: true, defaultGroupId })}
        onBatchCreateCriterion={handleOpenBatch}
        onEditCriterion={(criterion) => setCriterionModal({ open: true, criterion })}
      />
      <CriterionFormModal
        open={criterionModal.open}
        criterion={criterionModal.criterion}
        groups={groups.data ?? []}
        defaultGroupId={criterionModal.defaultGroupId}
        onClose={() => setCriterionModal({ open: false })}
      />
      <BatchCriterionModal
        open={batchModal.open}
        group={batchModal.group}
        groups={groups.data}
        onClose={() => setBatchModal({ open: false, group: undefined })}
      />
    </PageContainer>
  )
}
