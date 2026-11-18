import { Flex, Segmented, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useSession } from '@/features/auth'
import { ApprovalQueueSection } from '@/features/dashboard/components/ApprovalQueueSection'
import { CatalogSection } from '@/features/dashboard/components/CatalogSection'
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
    <Flex align="center" gap={12} style={{ marginTop: 8, marginBottom: 4 }}>
      <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}>
        {children}
      </Typography.Text>
      <div style={{ flex: 1, height: 1, background: 'var(--app-border)' }} />
    </Flex>
  )
}

/** Trang Tổng quan: Số liệu điều hành vận hành QC thật và tình hình danh mục thiết lập. */
export function DashboardPage() {
  const { user } = useSession()
  const { canAny } = usePermission()
  const canOps = canAny([PERMISSIONS.REPORT.READ, PERMISSIONS.INSPECTION.READ_ALL])
  const canApprove = canAny([PERMISSIONS.PLAN.APPROVE, PERMISSIONS.FINDING.CONCLUDE_APPEAL])
  const [months, setMonths] = useState(6)
  const today = dayjs()

  return (
    <PageContainer
      title="Tổng quan vận hành"
      subtitle={`Xin chào ${user?.fullName ?? ''} · ${capitalize(today.format('dddd, DD/MM/YYYY'))}`}
      extra={
        canOps ? (
          <Flex align="center" gap={8}>
            <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 500, textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>
              Khoảng thời gian:
            </span>
            <Segmented
              size="middle"
              options={PERIODS}
              value={months}
              onChange={(v) => setMonths(Number(v))}
            />
          </Flex>
        ) : undefined
      }
    >
      <Flex vertical gap={20} style={{ paddingBottom: 24 }}>
        {/* 1. KHỐI CHỈ SỐ KPI & BIỂU ĐỒ: Luôn ưu tiên hiển thị đầu trang Dashboard */}
        {canOps && (
          <>
            <SectionTitle>Chỉ số KPI & Biểu đồ phân tích vận hành QC</SectionTitle>
            <OperationsSection months={months} />
          </>
        )}

        {/* 2. HÀNG CHỜ PHÊ DUYỆT */}
        {canApprove && (
          <>
            <SectionTitle>Hàng chờ xử lý & phê duyệt</SectionTitle>
            <ApprovalQueueSection />
          </>
        )}

        {/* 3. QUY MÔ HỆ THỐNG & DANH MỤC TIÊU CHUẨN */}
        <SectionTitle>Quy mô hệ thống & Danh mục tiêu chuẩn</SectionTitle>
        <CatalogSection />
      </Flex>
    </PageContainer>
  )
}
