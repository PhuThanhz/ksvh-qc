import type {
  AppealReviewRequest,
  BatchActionResultResponse,
  BatchFindingConfirmRequest,
  BatchFindingVerifyRequest,
  BatchRemediationPlanRequest,
  CandidateFindingResponse,
  CandidateReviewerResponse,
  FindingAppealRequest,
  FindingConcludeAppealRequest,
  FindingPageResponse,
  FindingRemediationPlanRequest,
  FindingResponse,
  FindingStatus,
  FindingSubmitRemediationRequest,
  FindingVerifyRequest,
  InspectionCancelRequest,
  InspectionCheckinRequest,
  InspectionCreateRequest,
  InspectionBatchCreateRequest,
  InspectionItemResponse,
  InspectionPageResponse,
  InspectionResponse,
  InspectionStatus,
  InspectionSubmitRequest,
  PlanAssignmentResponse,
  PlanCreateRequest,
  PlanPageResponse,
  PlanRejectRequest,
  PlanResponse,
  PlanStatus,
  PlanUpdateRequest,
  PriorFindingsWarning,
  InspectorScheduleItem,
  SurpriseInspectionSuggestion,
} from '@/features/inspections/inspection.types'
import { api } from '@/lib/http'
import type { Id } from '@/types/common.types'

const PATH = {
  plans: '/inspection-plans',
  plan: (id: Id) => `/inspection-plans/${id}`,
  planSubmit: (id: Id) => `/inspection-plans/${id}/submit`,
  planApprove: (id: Id) => `/inspection-plans/${id}/approve`,
  planReject: (id: Id) => `/inspection-plans/${id}/reject`,
  planWarnings: '/inspection-plans/restaurant-warnings',
  inspectorSchedule: '/inspection-plans/inspector-schedule',
  planCopyableAssignments: (id: Id) => `/inspection-plans/${id}/copyable-assignments`,
  inspections: '/inspections',
  inspection: (id: Id) => `/inspections/${id}`,
  inspectionItems: (id: Id) => `/inspections/${id}/items`,
  inspectionBatch: '/inspections/batch',
  inspectionCheckin: (id: Id) => `/inspections/${id}/checkin`,
  inspectionSubmit: (id: Id) => `/inspections/${id}/submit`,
  inspectionCancel: (id: Id) => `/inspections/${id}/cancel`,
  inspectionAck: (id: Id) => `/inspections/${id}/acknowledge`,
  inspectionMyTasks: '/inspections/my-tasks',
  inspectionSurprise: '/inspections/surprise-suggestions',
  findings: '/findings',
  finding: (id: Id) => `/findings/${id}`,
  findingConfirm: (id: Id) => `/findings/${id}/confirm`,
  findingAppeal: (id: Id) => `/findings/${id}/appeal`,
  findingAppealReviews: (id: Id) => `/findings/${id}/appeal-reviews`,
  findingCandidateReviewers: (id: Id) => `/findings/${id}/candidate-reviewers`,
  findingPendingReviews: '/findings/pending-reviews',
  findingConcludeAppeal: (id: Id) => `/findings/${id}/conclude-appeal`,
  findingRemediationPlan: (id: Id) => `/findings/${id}/remediation-plan`,
  findingSubmitRemediation: (id: Id) => `/findings/${id}/submit-remediation`,
  findingVerify: (id: Id) => `/findings/${id}/verify`,
  findingVerificationCandidates: '/findings/verification-candidates',
  findingsBatchConfirm: '/findings/batch-confirm',
  findingsBatchRemediationPlan: '/findings/batch-remediation-plan',
  findingsBatchVerify: '/findings/batch-verify',
} as const

const data = <T>(r: { data: T }) => r.data

export const plansApi = {
  list: (params?: { keyword?: string; status?: PlanStatus; page?: number; size?: number }) =>
    api.get<PlanPageResponse>(PATH.plans, { params }).then(data),
  get: (id: Id) => api.get<PlanResponse>(PATH.plan(id)).then(data),
  create: (body: PlanCreateRequest) => api.post<PlanResponse>(PATH.plans, body).then(data),
  update: (id: Id, body: PlanUpdateRequest) => api.put<PlanResponse>(PATH.plan(id), body).then(data),
  submit: (id: Id) => api.post<PlanResponse>(PATH.planSubmit(id)).then(data),
  approve: (id: Id) => api.post<PlanResponse>(PATH.planApprove(id)).then(data),
  reject: (id: Id, body: PlanRejectRequest) => api.post<PlanResponse>(PATH.planReject(id), body).then(data),
  delete: (id: Id) => api.delete<void>(PATH.plan(id)).then(() => undefined),
  restaurantWarning: (restaurantId: number, beforeDate?: string) =>
    api.get<PriorFindingsWarning>(PATH.planWarnings, { params: { restaurantId, beforeDate } }).then(data),
  /** Lịch đã có của chuyên viên trong khoảng ngày (cảnh báo trùng lịch). */
  inspectorSchedule: (params: { from: string; to: string; excludePlanId?: number }) =>
    api.get<InspectorScheduleItem[]>(PATH.inspectorSchedule, { params }).then(data),
  copyableAssignments: (id: Id) =>
    api.get<PlanAssignmentResponse[]>(PATH.planCopyableAssignments(id)).then(data),
}

export const inspectionsApi = {
  list: (params?: {
    keyword?: string
    restaurantId?: number
    inspectorId?: number
    status?: InspectionStatus
    page?: number
    size?: number
  }) => api.get<InspectionPageResponse>(PATH.inspections, { params }).then(data),
  myTasks: () => api.get<InspectionResponse[]>(PATH.inspectionMyTasks).then(data),
  get: (id: Id) => api.get<InspectionResponse>(PATH.inspection(id)).then(data),
  getItems: (id: Id) => api.get<InspectionItemResponse[]>(PATH.inspectionItems(id)).then(data),
  create: (body: InspectionCreateRequest) => api.post<InspectionResponse>(PATH.inspections, body).then(data),
  createBatch: (body: InspectionBatchCreateRequest) =>
    api.post<InspectionResponse[]>(PATH.inspectionBatch, body).then(data),
  checkin: (id: Id, body: InspectionCheckinRequest) =>
    api.post<InspectionResponse>(PATH.inspectionCheckin(id), body).then(data),
  submit: (id: Id, body: InspectionSubmitRequest) =>
    api.post<InspectionResponse>(PATH.inspectionSubmit(id), body).then(data),
  cancel: (id: Id, body: InspectionCancelRequest) =>
    api.post<InspectionResponse>(PATH.inspectionCancel(id), body).then(data),
  acknowledge: (id: Id) => api.post<InspectionResponse>(PATH.inspectionAck(id)).then(data),
  surpriseSuggestions: () => api.get<SurpriseInspectionSuggestion[]>(PATH.inspectionSurprise).then(data),
}

export const findingsApi = {
  list: (params?: {
    keyword?: string
    restaurantId?: number
    inspectionId?: number
    status?: FindingStatus
    page?: number
    size?: number
  }) => api.get<FindingPageResponse>(PATH.findings, { params }).then(data),
  get: (id: Id) => api.get<FindingResponse>(PATH.finding(id)).then(data),
  confirm: (id: Id) => api.post<FindingResponse>(PATH.findingConfirm(id)).then(data),
  appeal: (id: Id, body: FindingAppealRequest) => api.post<FindingResponse>(PATH.findingAppeal(id), body).then(data),
  submitReview: (id: Id, body: AppealReviewRequest) =>
    api.post<FindingResponse>(PATH.findingAppealReviews(id), body).then(data),
  candidateReviewers: (id: Id) =>
    api.get<CandidateReviewerResponse[]>(PATH.findingCandidateReviewers(id)).then(data),
  pendingReviews: () => api.get<FindingResponse[]>(PATH.findingPendingReviews).then(data),
  concludeAppeal: (id: Id, body: FindingConcludeAppealRequest) =>
    api.post<FindingResponse>(PATH.findingConcludeAppeal(id), body).then(data),
  remediationPlan: (id: Id, body: FindingRemediationPlanRequest) =>
    api.post<FindingResponse>(PATH.findingRemediationPlan(id), body).then(data),
  submitRemediation: (id: Id, body: FindingSubmitRemediationRequest) =>
    api.post<FindingResponse>(PATH.findingSubmitRemediation(id), body).then(data),
  verify: (id: Id, body: FindingVerifyRequest) => api.post<FindingResponse>(PATH.findingVerify(id), body).then(data),
  verificationCandidates: (restaurantId: number) =>
    api.get<CandidateFindingResponse[]>(PATH.findingVerificationCandidates, { params: { restaurantId } }).then(data),
  batchConfirm: (body: BatchFindingConfirmRequest) =>
    api.post<BatchActionResultResponse>(PATH.findingsBatchConfirm, body).then(data),
  batchRemediationPlan: (body: BatchRemediationPlanRequest) =>
    api.post<BatchActionResultResponse>(PATH.findingsBatchRemediationPlan, body).then(data),
  batchVerify: (body: BatchFindingVerifyRequest) =>
    api.post<BatchActionResultResponse>(PATH.findingsBatchVerify, body).then(data),
}
