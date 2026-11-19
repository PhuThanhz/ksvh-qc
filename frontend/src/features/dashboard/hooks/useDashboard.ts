import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboard.api'
import { dashboardKeys } from '@/features/dashboard/api/dashboard.keys'
import type { DashboardPeriod } from '@/features/dashboard/dashboard.period'

/** Số liệu vận hành cho trang Tổng quan; chỉ gọi khi người dùng có quyền xem báo cáo. */
export function useDashboard(period: DashboardPeriod, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.summary(period.from, period.to),
    queryFn: () => dashboardApi.summary(period),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useApprovalQueue(enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'approval-queue'],
    queryFn: () => dashboardApi.approvalQueue(),
    enabled,
    refetchInterval: 30_000,
  })
}
