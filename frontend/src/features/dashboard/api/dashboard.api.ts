import { api } from '@/lib/http'
import type { DashboardResponse } from '@/types/api.generated'

const PATH = {
  summary: '/reports/dashboard',
} as const

export const dashboardApi = {
  summary: (months: number) => api.get<DashboardResponse>(PATH.summary, { params: { months } }).then((r) => r.data),
}
