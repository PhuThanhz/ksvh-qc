import type { components } from '@/types/api.generated'
import type { PageResponse } from '@/types/common.types'

type Schemas = components['schemas']

export type PlanStatus = Schemas['PlanResponse']['status']
export type InspectionStatus = NonNullable<Schemas['PlanAssignmentResponse']['inspectionStatus']>

export type PlanAssignmentRequest = Schemas['PlanAssignmentRequest']
export type PlanAssignmentResponse = Schemas['PlanAssignmentResponse']
export type PlanResponse = Schemas['PlanResponse']
export type PlanCreateRequest = Schemas['PlanCreateRequest']
export type PlanRejectRequest = Schemas['PlanRejectRequest']

export interface PlanUpdateRequest {
  title: string
  startDate: string
  endDate: string
  notes?: string
  assignments?: PlanAssignmentRequest[]
}

export type PlanPageResponse = PageResponse<PlanResponse>
