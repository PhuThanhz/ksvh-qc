import type { PageResponse } from '@/types/common.types'

export type PlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
export type InspectionStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED'
export type ItemResult = 'PASS' | 'FAIL' | 'NA' | 'UNRATED'
export type FindingStatus =
  | 'OPEN'
  | 'CONFIRMED'
  | 'APPEALED'
  | 'REMEDIATING'
  | 'PENDING_VERIFICATION'
  | 'CLOSED'
  | 'DISMISSED'
export type AppealConclusion = 'UPHELD' | 'DISMISSED'

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
}

export interface PlanCreateRequest {
  planCode: string
  title: string
  startDate: string
  endDate: string
  notes?: string
}

export interface PlanUpdateRequest {
  title: string
  startDate: string
  endDate: string
  notes?: string
}

export interface PlanRejectRequest {
  reason: string
}

export interface InspectionItemResponse {
  id: number
  criterionId: number
  criterionCode: string
  criterionName: string
  groupName?: string
  baseImpact: number
  sortOrder: number
  result: ItemResult
  comment?: string
  evidenceUrls?: string
  evaluatedAt?: string
}

/** Loại kiểm tra: định kỳ tháng (đủ mẫu phiếu, thực tế) / đột xuất (theo chuyên đề). */
export type InspectionKind = 'PERIODIC' | 'SURPRISE'
/** Hình thức: thực tế tại nhà hàng / từ xa. */
export type InspectionMode = 'ON_SITE' | 'REMOTE'
/** Kết quả xác nhận vị trí khi bắt đầu (chỉ ghi nhận, không chặn). */
export type LocationStatus = 'VERIFIED' | 'OUTSIDE_RADIUS' | 'UNVERIFIED' | 'REMOTE'

export const INSPECTION_KIND_LABEL: Record<InspectionKind, string> = { PERIODIC: 'Định kỳ tháng', SURPRISE: 'Đột xuất' }
export const INSPECTION_MODE_LABEL: Record<InspectionMode, string> = { ON_SITE: 'Thực tế tại nhà hàng', REMOTE: 'Từ xa' }
export const LOCATION_STATUS_META: Record<LocationStatus, { label: string; color: string }> = {
  VERIFIED: { label: 'Đúng vị trí', color: 'success' },
  OUTSIDE_RADIUS: { label: 'Ngoài bán kính', color: 'warning' },
  UNVERIFIED: { label: 'Chưa xác minh vị trí', color: 'default' },
  REMOTE: { label: 'Kiểm tra từ xa', color: 'processing' },
}

export interface InspectionResponse {
  id: number
  code: string
  planId?: number
  restaurantId: number
  restaurantName?: string
  templateId?: number | null
  templateName?: string | null
  inspectorId: number
  inspectorName?: string
  inspectionType: InspectionKind
  inspectionMode: InspectionMode
  locationStatus?: LocationStatus | null
  topicNames: string[]
  complianceScore?: number | null
  status: InspectionStatus
  cancelReason?: string
  checkinLat?: number
  checkinLng?: number
  checkinDistanceM?: number
  checkinAt?: string
  submittedAt?: string
  completedAt?: string
  totalCriteria: number
  passedCriteria: number
  failedCriteria: number
  naCriteria: number
  totalRiskScore: number
  maxRiskLevel?: string
  notes?: string
  createdAt: string
  items?: InspectionItemResponse[]
}

export interface InspectionCreateRequest {
  code: string
  planId?: number
  restaurantId: number
  templateId?: number
  inspectorId: number
  inspectionType: InspectionKind
  inspectionMode?: InspectionMode
  topicGroupIds?: number[]
  notes?: string
}

export interface InspectionCheckinRequest {
  latitude?: number | null
  longitude?: number | null
}

export interface InspectionSubmitItemRequest {
  criterionId: number
  result: ItemResult
  comment?: string
  evidenceUrls?: string
}

export interface InspectionSubmitRequest {
  items: InspectionSubmitItemRequest[]
  notes?: string
}

export interface InspectionCancelRequest {
  reason: string
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
  remediationPlan?: string
  /** Ngày hẹn CHT chọn, không vượt deadlineDate (hạn theo mức rủi ro do server tính). */
  remediationTargetDate?: string
  remediationEvidenceUrls?: string
  remediationSubmittedAt?: string
  verifiedBy?: number
  verifiedByName?: string
  verifiedAt?: string
  verifiedPassed?: boolean
  verificationComment?: string
  createdAt: string
  /** Lịch sử thao tác (chỉ có khi xem chi tiết / sau khi thao tác). */
  history?: FindingEventResponse[]
}

export type FindingEventAction =
  | 'CREATED'
  | 'CONFIRMED'
  | 'APPEALED'
  | 'APPEAL_UPHELD'
  | 'APPEAL_DISMISSED'
  | 'REMEDIATION_PLANNED'
  | 'REMEDIATION_SUBMITTED'
  | 'VERIFY_PASSED'
  | 'VERIFY_FAILED'

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

export interface FindingAppealRequest {
  appealReason: string
  appealEvidenceUrls?: string
}

export interface FindingConcludeAppealRequest {
  conclusion: AppealConclusion
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

export type PlanPageResponse = PageResponse<PlanResponse>
export type InspectionPageResponse = PageResponse<InspectionResponse>
export type FindingPageResponse = PageResponse<FindingResponse>
