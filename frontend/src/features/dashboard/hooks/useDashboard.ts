import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboard.api'
import { dashboardKeys } from '@/features/dashboard/api/dashboard.keys'

/** Số liệu vận hành cho trang Tổng quan; chỉ gọi khi người dùng có quyền xem báo cáo. */
export function useDashboard(months: number, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.summary(months),
    queryFn: () => dashboardApi.summary(months),
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
