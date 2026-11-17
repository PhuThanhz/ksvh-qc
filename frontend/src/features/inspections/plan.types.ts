import type { PageResponse } from '@/types/common.types'

export type PlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
export type InspectionStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AWAITING_ACK' | 'COMPLETED' | 'CANCELLED'

export interface PlanAssignmentRequest {
  restaurantId: number
  inspectorId: number
  templateId: number
  scheduledDate: string
}

export interface PlanAssignmentResponse {
  id: number
  restaurantId: number
  restaurantCode?: string
  restaurantName?: string
  inspectorId: number
  inspectorName?: string
  templateId: number
  templateName?: string
  scheduledDate: string
  inspectionId?: number | null
  inspectionCode?: string | null
  inspectionStatus?: InspectionStatus | null
  priorUnresolvedCount?: number
}

export interface PlanResponse {
  id: number
  planCode: string
  title: string
  startDate: string
  endDate: string
  status: PlanStatus
  notes?: string
  rejectionReason?: string
  createdBy?: number
  createdByName?: string
  approvedBy?: number
  approvedByName?: string
  approvedAt?: string
  createdAt: string
  updatedAt?: string
  assignmentCount?: number
  assignments?: PlanAssignmentResponse[]
}

export interface PlanCreateRequest {
  planCode: string
  title: string
  startDate: string
  endDate: string
  notes?: string
  assignments?: PlanAssignmentRequest[]
}

export interface PlanUpdateRequest {
  title: string
  startDate: string
  endDate: string
  notes?: string
  assignments?: PlanAssignmentRequest[]
}

export interface PlanRejectRequest {
  reason: string
}

export type PlanPageResponse = PageResponse<PlanResponse>
