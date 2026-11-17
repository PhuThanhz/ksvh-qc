import type { PageResponse } from '@/types/common.types'

export type FindingStatus =
  | 'OPEN'
  | 'CONFIRMED'
  | 'APPEALED'
  | 'APPEAL_MEETING'
  | 'REMEDIATING'
  | 'PENDING_VERIFICATION'
  | 'CLOSED'
  | 'DISMISSED'

export const FINDING_STATUS_TAG: Record<FindingStatus, { color: string; label: string }> = {
  OPEN: { color: 'warning', label: 'Chờ phản hồi' },
  CONFIRMED: { color: 'processing', label: 'Đã xác nhận' },
  APPEALED: { color: 'warning', label: 'Đang khiếu nại' },
  APPEAL_MEETING: { color: 'magenta', label: 'Họp khiếu nại' },
  REMEDIATING: { color: 'processing', label: 'Đang khắc phục' },
  PENDING_VERIFICATION: { color: 'warning', label: 'Chờ nghiệm thu' },
  CLOSED: { color: 'success', label: 'Đã đóng' },
  DISMISSED: { color: 'default', label: 'Đã huỷ bỏ' },
}

export type AppealConclusion = 'UPHELD' | 'DISMISSED'

export type AppealVerdict = 'PENDING' | 'FINDING_VALID' | 'FINDING_INVALID'

export interface CandidateReviewerResponse {
  id: number
  username: string
  fullName: string
  ksvhRep: boolean
  roles: string[]
}

export interface AppealReviewRequest {
  verdict: AppealVerdict
  comment?: string
}

export interface AppealReviewResponse {
  id: number
  findingId: number
  reviewerId: number
  reviewerName?: string
  reviewerRoles?: string
  appealRound: number
  verdict: AppealVerdict
  comment?: string
  reviewedAt?: string
  createdAt: string
}

export type FindingEventAction =
  | 'CREATED'
  | 'CONFIRMED'
  | 'APPEALED'
  | 'APPEAL_REVIEWED'
  | 'APPEAL_MEETING'
  | 'APPEAL_UPHELD'
  | 'APPEAL_DISMISSED'
  | 'REMEDIATION_PLANNED'
  | 'REMEDIATION_SUBMITTED'
  | 'VERIFY_PASSED'
  | 'VERIFY_FAILED'
  | 'OVERDUE'

export interface FindingEventResponse {
  id: number
  action: FindingEventAction
  fromStatus?: FindingStatus
  toStatus: FindingStatus
  actorId?: number
  actorName?: string
  note?: string
  createdAt: string
}

export interface FindingResponse {
  id: number
  inspectionId: number
  inspectionCode?: string
  inspectionItemId?: number
  restaurantId: number
  restaurantName?: string
  criterionId: number
  criterionCode?: string
  criterionName?: string
  baseImpact: number
  effectiveImpact?: number
  violationCount: number
  calculatedScore: number
  riskLevelCode: string
  riskLevelName: string
  remediationDays: number
  deadlineDate: string
  status: FindingStatus
  description: string
  evidenceUrls?: string
  appealReason?: string
  appealEvidenceUrls?: string
  appealSubmittedAt?: string
  appealConclusion?: AppealConclusion
  appealConcludedBy?: number
  appealConcludedByName?: string
  appealRound?: number
  appealReviews?: AppealReviewResponse[]
  remediationPlan?: string
  remediationTargetDate?: string
  remediationEvidenceUrls?: string
  remediationSubmittedAt?: string
  verifiedBy?: number
  verifiedByName?: string
  verifiedAt?: string
  verifiedPassed?: boolean
  verificationComment?: string
  createdAt: string
  history?: FindingEventResponse[]
}

export interface FindingAppealRequest {
  appealReason: string
  appealEvidenceUrls?: string
  reviewerIds: number[]
}

export interface FindingConcludeAppealRequest {
  conclusion: AppealConclusion
  meetingNotes?: string
}

export interface FindingRemediationPlanRequest {
  remediationPlan: string
  remediationDeadline: string
}

export interface FindingSubmitRemediationRequest {
  remediationEvidenceUrls: string
}

export interface FindingVerifyRequest {
  passed: boolean
  comment?: string
}

export type FindingPageResponse = PageResponse<FindingResponse>
