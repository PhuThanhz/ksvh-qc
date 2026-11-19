import { api } from '@/lib/http'
import type { DashboardResponse } from '@/types/api.generated'

export interface PendingPlanItem {
  id: number
  planCode: string
  title: string
  startDate: string
  endDate: string
  restaurantCount: number
  createdAt: string
}

export interface AppealMeetingItem {
  id: number
  inspectionId: number
  inspectionCode: string
  restaurantId: number
  restaurantName: string
  riskLevelCode: string
  appealReason: string
  updatedAt: string
}

export interface ApprovalQueueResponse {
  pendingPlans: PendingPlanItem[]
  appealMeetings: AppealMeetingItem[]
}

const PATH = {
  summary: '/reports/dashboard',
  approvalQueue: '/reports/approval-queue',
} as const

export const dashboardApi = {
  summary: (period: { from: string; to: string }) =>
    api.get<DashboardResponse>(PATH.summary, { params: { from: period.from, to: period.to } }).then((r) => r.data),
  approvalQueue: () => api.get<ApprovalQueueResponse>(PATH.approvalQueue).then((r) => r.data),
}
