import { Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useSession } from '@/features/auth'
import { ApprovalQueueSection } from '@/features/dashboard/components/ApprovalQueueSection'
import { CatalogSection } from '@/features/dashboard/components/CatalogSection'
import { DashboardPeriodPicker } from '@/features/dashboard/components/DashboardPeriodPicker'
import { OperationsSection } from '@/features/dashboard/components/OperationsSection'
import { defaultPeriod } from '@/features/dashboard/dashboard.period'
import { PERMISSIONS, usePermission } from '@/permissions'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function SectionTitle({ children }: { children: string }) {
  return (
    <Flex align="center" gap={12} style={{ marginTop: 8, marginBottom: 4 }}>
      {/* Tiêu đề nằm trực tiếp trên nền ảnh tối → chữ trắng có bóng để dễ đọc */}
      <Typography.Text
        style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.18)' }}
      >
        {children}
      </Typography.Text>
      <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.35)' }} />
    </Flex>
  )
}

/** Trang Tổng quan: Số liệu điều hành vận hành QC thật và tình hình danh mục thiết lập. */
export function DashboardPage() {
  const { user } = useSession()
  const { canAny } = usePermission()
  const canOps = canAny([PERMISSIONS.REPORT.READ, PERMISSIONS.INSPECTION.READ_ALL])
  const canApprove = canAny([PERMISSIONS.PLAN.APPROVE, PERMISSIONS.FINDING.CONCLUDE_APPEAL])
  const [period, setPeriod] = useState(defaultPeriod)
  const today = dayjs()

  return (
    <PageContainer
      title="Tổng quan vận hành"
      subtitle={`Xin chào ${user?.fullName ?? ''} · ${capitalize(today.format('dddd, DD/MM/YYYY'))}`}
      // Kỳ thống kê tự chọn (góc phải như nút hành động các trang khác). Chỉ đổi số "theo kỳ";
      // số "Hiện tại" (lỗi đang mở, rủi ro) không phụ thuộc kỳ.
      extra={canOps ? <DashboardPeriodPicker value={period} onChange={setPeriod} /> : undefined}
    >
      <Flex vertical gap={20} style={{ paddingBottom: 24 }}>
        {/* 1. KHỐI CHỈ SỐ KPI & BIỂU ĐỒ: Luôn ưu tiên hiển thị đầu trang Dashboard */}
        {canOps && (
          <>
            <SectionTitle>Chỉ số KPI & Biểu đồ phân tích vận hành QC</SectionTitle>
            <OperationsSection period={period} />
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
        <SectionTitle>Quy mô hệ thống & Danh mục tiêu chí</SectionTitle>
        <CatalogSection />
      </Flex>
    </PageContainer>
  )
}
