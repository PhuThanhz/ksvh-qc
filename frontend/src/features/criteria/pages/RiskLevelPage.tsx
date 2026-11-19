import { Button } from 'antd'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { RiskLevelExcelActions } from '@/features/criteria/components/RiskLevelExcelActions'
import { RiskLevelSection } from '@/features/criteria/components/RiskLevelSection'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Danh mục 7: bảng phân loại mức rủi ro M1–M4. */
export function RiskLevelPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.CRITERIA.MANAGE)

  return (
    <PageContainer
      title="Phân loại rủi ro"
      subtitle="Cấu hình thang mức rủi ro (M1–M4), khoảng điểm vi phạm và thời hạn khắc phục bắt buộc trên toàn hệ thống"
      headerExtra={<RiskLevelExcelActions />}
      extra={
        canManage && (
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Cập nhật thang phân loại
          </Button>
        )
      }
    >
      <RiskLevelSection
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
      />
    </PageContainer>
  )
}
