import type {
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
  PlanCreateRequest,
  PlanPageResponse,
  PlanRejectRequest,
  PlanResponse,
  PlanStatus,
  PlanUpdateRequest,
} from '@/features/inspections/inspection.types'
import { api } from '@/lib/http'
import type { Id } from '@/types/common.types'

const data = <T>(r: { data: T }) => r.data

export const plansApi = {
  list: (params?: { keyword?: string; status?: PlanStatus; page?: number; size?: number }) =>
    api.get<PlanPageResponse>('/inspection-plans', { params }).then(data),
  get: (id: Id) => api.get<PlanResponse>(`/inspection-plans/${id}`).then(data),
  create: (body: PlanCreateRequest) => api.post<PlanResponse>('/inspection-plans', body).then(data),
  update: (id: Id, body: PlanUpdateRequest) => api.put<PlanResponse>(`/inspection-plans/${id}`, body).then(data),
  submit: (id: Id) => api.post<PlanResponse>(`/inspection-plans/${id}/submit`).then(data),
  approve: (id: Id) => api.post<PlanResponse>(`/inspection-plans/${id}/approve`).then(data),
  reject: (id: Id, body: PlanRejectRequest) => api.post<PlanResponse>(`/inspection-plans/${id}/reject`, body).then(data),
  delete: (id: Id) => api.delete<void>(`/inspection-plans/${id}`).then(() => undefined),
}

export const inspectionsApi = {
  list: (params?: { keyword?: string; restaurantId?: number; inspectorId?: number; status?: InspectionStatus; page?: number; size?: number }) =>
    api.get<InspectionPageResponse>('/inspections', { params }).then(data),
  myTasks: () => api.get<InspectionResponse[]>('/inspections/my-tasks').then(data),
  get: (id: Id) => api.get<InspectionResponse>(`/inspections/${id}`).then(data),
  getItems: (id: Id) => api.get<InspectionItemResponse[]>(`/inspections/${id}/items`).then(data),
  create: (body: InspectionCreateRequest) => api.post<InspectionResponse>('/inspections', body).then(data),
  createBatch: (body: InspectionBatchCreateRequest) => api.post<InspectionResponse[]>('/inspections/batch', body).then(data),
  checkin: (id: Id, body: InspectionCheckinRequest) => api.post<InspectionResponse>(`/inspections/${id}/checkin`, body).then(data),
  submit: (id: Id, body: InspectionSubmitRequest) => api.post<InspectionResponse>(`/inspections/${id}/submit`, body).then(data),
  cancel: (id: Id, body: InspectionCancelRequest) => api.post<InspectionResponse>(`/inspections/${id}/cancel`, body).then(data),
}

export const findingsApi = {
  list: (params?: { keyword?: string; restaurantId?: number; inspectionId?: number; status?: FindingStatus; page?: number; size?: number }) =>
    api.get<FindingPageResponse>('/findings', { params }).then(data),
  get: (id: Id) => api.get<FindingResponse>(`/findings/${id}`).then(data),
  confirm: (id: Id) => api.post<FindingResponse>(`/findings/${id}/confirm`).then(data),
  appeal: (id: Id, body: FindingAppealRequest) => api.post<FindingResponse>(`/findings/${id}/appeal`, body).then(data),
  concludeAppeal: (id: Id, body: FindingConcludeAppealRequest) =>
    api.post<FindingResponse>(`/findings/${id}/conclude-appeal`, body).then(data),
  remediationPlan: (id: Id, body: FindingRemediationPlanRequest) =>
    api.post<FindingResponse>(`/findings/${id}/remediation-plan`, body).then(data),
  submitRemediation: (id: Id, body: FindingSubmitRemediationRequest) =>
    api.post<FindingResponse>(`/findings/${id}/submit-remediation`, body).then(data),
  verify: (id: Id, body: FindingVerifyRequest) => api.post<FindingResponse>(`/findings/${id}/verify`, body).then(data),
}
