import type { PageResponse } from '@/types/common.types'

export * from './plan.types'
export * from './finding.types'

export type ItemResult = 'PASS' | 'FAIL' | 'NA' | 'UNRATED'

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
  findingId?: number
  findingDescription?: string
  findingEvidenceUrls?: string
  remediationPlan?: string
  remediationEvidenceUrls?: string
  findingStatus?: string
}

/** Loại kiểm tra: định kỳ tháng (đủ mẫu phiếu, thực tế) / đột xuất (theo chuyên đề) / kiểm tra khắc phục. */
export type InspectionKind = 'PERIODIC' | 'SURPRISE' | 'VERIFICATION'
/** Hình thức: thực tế tại nhà hàng / từ xa. */
export type InspectionMode = 'ON_SITE' | 'REMOTE'
/** Kết quả xác nhận vị trí khi bắt đầu (chỉ ghi nhận, không chặn). */
export type LocationStatus = 'VERIFIED' | 'OUTSIDE_RADIUS' | 'UNVERIFIED' | 'REMOTE'

export const INSPECTION_KIND_LABEL: Record<InspectionKind, string> = {
  PERIODIC: 'Định kỳ tháng',
  SURPRISE: 'Đột xuất',
  VERIFICATION: 'Kiểm tra khắc phục',
}
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
  adjustedComplianceScore?: number | null
  status: import('./plan.types').InspectionStatus
  cancelReason?: string
  checkinLat?: number
  checkinLng?: number
  checkinDistanceM?: number
  checkinAt?: string
  submittedAt?: string
  completedAt?: string
  /** CHT xác nhận đã xem phiếu không có lỗi. */
  acknowledgedAt?: string | null
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
  findingIds?: number[]
}

export interface InspectionBatchCreateRequest {
  codePrefix: string
  planId?: number
  restaurantIds: number[]
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
  itemId?: number
  criterionId: number
  result: ItemResult
  comment?: string
  evidenceUrls?: string
  findingId?: number
}

export interface InspectionSubmitRequest {
  items: InspectionSubmitItemRequest[]
  notes?: string
}

export interface InspectionCancelRequest {
  reason: string
}

export interface CandidateFindingResponse {
  id: number
  inspectionId: number
  inspectionCode?: string
  criterionId: number
  criterionCode: string
  criterionName: string
  groupName?: string
  baseImpact: number
  effectiveImpact: number
  riskLevelCode: string
  calculatedScore: number
  status: import('./finding.types').FindingStatus
  description: string
  evidenceUrls?: string
  remediationPlan?: string
  remediationEvidenceUrls?: string
  remediationSubmittedAt?: string
  deadlineDate: string
}

export interface SurpriseInspectionSuggestion {
  restaurantId: number
  restaurantCode: string
  restaurantName: string
  companyId?: number
  companyName?: string
  totalRiskScore: number
  highestRiskLevel: string
  m4Count: number
  m3Count: number
  openFindingCount: number
  escalatedCriteriaCount: number
  primaryReason: string
  suggestedTopicGroupIds: number[]
  suggestedTopicGroupNames: string[]
}

export interface PriorFindingsWarning {
  restaurantId: number
  restaurantCode: string
  restaurantName: string
  unverifiedCount: number
  totalUnresolvedCount: number
  warningDetails: string[]
}

export type InspectionPageResponse = PageResponse<InspectionResponse>
