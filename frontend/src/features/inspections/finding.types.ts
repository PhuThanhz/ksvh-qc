import type { components } from '@/types/api.generated'
import type { PageResponse } from '@/types/common.types'
import { FINDING_STATUS_META } from './constants/status'

type Schemas = components['schemas']

export type FindingStatus = Schemas['FindingResponse']['status']
export const FINDING_STATUS_TAG = FINDING_STATUS_META

export type AppealConclusion = 'UPHELD' | 'DISMISSED'
export type AppealVerdict = 'PENDING' | 'FINDING_VALID' | 'FINDING_INVALID'

export type CandidateReviewerResponse = Schemas['CandidateReviewerResponse']
export type AppealReviewRequest = Schemas['AppealReviewRequest']
export type AppealReviewResponse = Schemas['AppealReviewResponse']

export type FindingEventAction = Schemas['FindingEventResponse']['action']
export type FindingEventResponse = Schemas['FindingEventResponse']

export type FindingResponse = Schemas['FindingResponse'] & {
  events?: FindingEventResponse[]
  appealReviews?: AppealReviewResponse[]
}

export type FindingVerifyRequest = Schemas['FindingVerifyRequest']
export type FindingSubmitRemediationRequest = Schemas['FindingSubmitRemediationRequest']
export type FindingRemediationPlanRequest = Schemas['FindingRemediationPlanRequest']
export type FindingConcludeAppealRequest = Schemas['FindingConcludeAppealRequest']
export type FindingAppealRequest = Schemas['FindingAppealRequest']

export interface BatchActionResultResponse {
  total: number
  successCount: number
  failedCount: number
  errors: string[]
}

export interface BatchFindingConfirmRequest {
  findingIds: number[]
  agreed: boolean
  note?: string
}

export interface BatchRemediationPlanRequest {
  findingIds: number[]
  remediationPlan: string
  targetDate: string
}

export interface BatchFindingVerifyRequest {
  findingIds: number[]
  approved: boolean
  note?: string
}

export interface FindingFilter {
  page?: number
  size?: number
  inspectionId?: number
  restaurantId?: number
  status?: FindingStatus
  riskLevelCode?: string
  overdueOnly?: boolean
  keyword?: string
}

export type FindingPageResponse = PageResponse<FindingResponse>
