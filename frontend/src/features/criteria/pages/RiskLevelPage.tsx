import { PlusOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
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
      subtitle="Cấu hình thang mức rủi ro (M1–M4), khoảng điểm vi phạm và thời hạn khắc phục bắt buộc"
      extra={
        <Space size={8} wrap>
          <RiskLevelExcelActions />
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              Thêm bảng phân loại mới
            </Button>
          )}
        </Space>
      }
    >
      <RiskLevelSection
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
      />
    </PageContainer>
  )
}
