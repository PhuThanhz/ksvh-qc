import { Flex, Segmented, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useSession } from '@/features/auth'
import { CatalogSection } from '@/features/dashboard/components/CatalogSection'
import { CreateMenu } from '@/features/dashboard/components/CreateMenu'
import { OperationsSection } from '@/features/dashboard/components/OperationsSection'
import { PERMISSIONS, usePermission } from '@/permissions'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const PERIODS = [
  { label: '3 tháng', value: 3 },
  { label: '6 tháng', value: 6 },
  { label: '12 tháng', value: 12 },
]

function SectionTitle({ children }: { children: string }) {
  return (
    <Flex align="center" gap={12} style={{ marginTop: 4 }}>
      <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: '#3a3936', whiteSpace: 'nowrap' }}>{children}</Typography.Text>
      <div style={{ flex: 1, height: 1, background: 'rgba(0, 0, 0, 0.08)' }} />
    </Flex>
  )
}

/** Trang Tổng quan: số liệu vận hành (nếu có quyền xem báo cáo) và tình hình danh mục. */
export function DashboardPage() {
  const { user } = useSession()
  const { canAny } = usePermission()
  const canOps = canAny([PERMISSIONS.REPORT.READ, PERMISSIONS.INSPECTION.READ_ALL])
  const [months, setMonths] = useState(6)
  const today = dayjs()

  return (
    <PageContainer
      title="Tổng quan"
      subtitle={`Xin chào ${user?.fullName ?? ''} · ${capitalize(today.format('dddd, DD/MM/YYYY'))}`}
      extra={
        <Space size={8}>
          {canOps && <Segmented size="middle" options={PERIODS} value={months} onChange={(v) => setMonths(Number(v))} />}
          <CreateMenu />
        </Space>
      }
    >
      <Flex vertical gap={16} style={{ paddingBottom: 24 }}>
        {canOps && (
          <>
            <SectionTitle>Hoạt động kiểm soát</SectionTitle>
            <OperationsSection months={months} />
          </>
        )}
        <SectionTitle>Danh mục</SectionTitle>
        <CatalogSection />
      </Flex>
    </PageContainer>
  )
}
