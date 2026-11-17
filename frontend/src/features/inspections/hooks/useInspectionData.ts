import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { findingsApi, inspectionsApi, plansApi } from '@/features/inspections/api/inspection.api'
import type {
  AppealReviewRequest,
  FindingAppealRequest,
  FindingConcludeAppealRequest,
  FindingRemediationPlanRequest,
  FindingStatus,
  FindingSubmitRemediationRequest,
  FindingVerifyRequest,
  InspectionCancelRequest,
  InspectionCheckinRequest,
  InspectionCreateRequest,
  InspectionBatchCreateRequest,
  InspectionStatus,
  InspectionSubmitRequest,
  PlanCreateRequest,
  PlanRejectRequest,
  PlanStatus,
  PlanUpdateRequest,
} from '@/features/inspections/inspection.types'
import type { Id } from '@/types/common.types'

export const inspectionKeys = {
  all: ['inspections'] as const,
  plans: () => [...inspectionKeys.all, 'plans'] as const,
  planList: (params?: Record<string, unknown>) => [...inspectionKeys.plans(), 'list', params] as const,
  plan: (id: Id) => [...inspectionKeys.plans(), 'detail', id] as const,

  inspections: () => [...inspectionKeys.all, 'records'] as const,
  inspectionList: (params?: Record<string, unknown>) => [...inspectionKeys.inspections(), 'list', params] as const,
  myTasks: () => [...inspectionKeys.inspections(), 'my-tasks'] as const,
  inspection: (id: Id) => [...inspectionKeys.inspections(), 'detail', id] as const,
  items: (id: Id) => [...inspectionKeys.inspections(), 'items', id] as const,

  findings: () => [...inspectionKeys.all, 'findings'] as const,
  findingList: (params?: Record<string, unknown>) => [...inspectionKeys.findings(), 'list', params] as const,
  finding: (id: Id) => [...inspectionKeys.findings(), 'detail', id] as const,
  pendingReviews: () => [...inspectionKeys.findings(), 'pending-reviews'] as const,
  candidateReviewers: (id: Id) => [...inspectionKeys.findings(), 'candidates', id] as const,
}

// ---- Plans ----
export function usePlans(params?: { keyword?: string; status?: PlanStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: inspectionKeys.planList(params),
    queryFn: () => plansApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function usePlan(id?: Id) {
  return useQuery({
    queryKey: inspectionKeys.plan(id!),
    queryFn: () => plansApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useSavePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: PlanCreateRequest | PlanUpdateRequest }) =>
      id === undefined ? plansApi.create(body as PlanCreateRequest) : plansApi.update(id, body as PlanUpdateRequest),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.plans() }),
  })
}

export function usePlanActions() {
  const qc = useQueryClient()
  const submit = useMutation({
    mutationFn: (id: Id) => plansApi.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.plans() }),
  })
  const approve = useMutation({
    mutationFn: (id: Id) => plansApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.plans() }),
  })
  const reject = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: PlanRejectRequest }) => plansApi.reject(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.plans() }),
  })
  const remove = useMutation({
    mutationFn: (id: Id) => plansApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.plans() }),
  })
  return { submit, approve, reject, remove }
}

// ---- Inspections ----
export function useInspections(params?: {
  keyword?: string
  restaurantId?: number
  inspectorId?: number
  status?: InspectionStatus
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: inspectionKeys.inspectionList(params),
    queryFn: () => inspectionsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useMyTasks() {
  return useQuery({
    queryKey: inspectionKeys.myTasks(),
    queryFn: () => inspectionsApi.myTasks(),
  })
}

export function useInspection(id: Id | undefined) {
  return useQuery({
    queryKey: inspectionKeys.inspection(id ?? 0),
    queryFn: () => inspectionsApi.get(id ?? 0),
    enabled: id !== undefined && id > 0,
  })
}

export function useInspectionItems(id: Id | undefined) {
  return useQuery({
    queryKey: inspectionKeys.items(id ?? 0),
    queryFn: () => inspectionsApi.getItems(id ?? 0),
    enabled: id !== undefined && id > 0,
  })
}

export function useInspectionMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: (body: InspectionCreateRequest) => inspectionsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.inspections() }),
  })
  const createBatch = useMutation({
    mutationFn: (body: InspectionBatchCreateRequest) => inspectionsApi.createBatch(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.inspections() }),
  })
  const checkin = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: InspectionCheckinRequest }) => inspectionsApi.checkin(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionKeys.inspections() })
    },
  })
  const submit = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: InspectionSubmitRequest }) => inspectionsApi.submit(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionKeys.inspections() })
      qc.invalidateQueries({ queryKey: inspectionKeys.findings() })
    },
  })
  const cancel = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: InspectionCancelRequest }) => inspectionsApi.cancel(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.inspections() }),
  })
  const acknowledge = useMutation({
    mutationFn: (id: Id) => inspectionsApi.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.inspections() }),
  })
  return { create, createBatch, checkin, submit, cancel, acknowledge }
}

// ---- Findings ----
export function useFindings(params?: {
  keyword?: string
  restaurantId?: number
  inspectionId?: number
  status?: FindingStatus
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: inspectionKeys.findingList(params),
    queryFn: () => findingsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useFinding(id?: Id) {
  return useQuery({
    queryKey: inspectionKeys.finding(id!),
    queryFn: () => findingsApi.get(id!),
    enabled: !!id,
  })
}

export function usePendingReviews() {
  return useQuery({
    queryKey: inspectionKeys.pendingReviews(),
    queryFn: () => findingsApi.pendingReviews(),
  })
}

export function useCandidateReviewers(id?: Id) {
  return useQuery({
    queryKey: inspectionKeys.candidateReviewers(id ?? 0),
    queryFn: () => findingsApi.candidateReviewers(id ?? 0),
    enabled: !!id && id > 0,
  })
}

export function useFindingMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: inspectionKeys.findings() })

  const confirm = useMutation({
    mutationFn: (id: Id) => findingsApi.confirm(id),
    onSuccess: invalidate,
  })
  const appeal = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: FindingAppealRequest }) => findingsApi.appeal(id, body),
    onSuccess: invalidate,
  })
  const submitReview = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: AppealReviewRequest }) => findingsApi.submitReview(id, body),
    onSuccess: invalidate,
  })
  const concludeAppeal = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: FindingConcludeAppealRequest }) => findingsApi.concludeAppeal(id, body),
    onSuccess: invalidate,
  })
  const remediationPlan = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: FindingRemediationPlanRequest }) => findingsApi.remediationPlan(id, body),
    onSuccess: invalidate,
  })
  const submitRemediation = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: FindingSubmitRemediationRequest }) => findingsApi.submitRemediation(id, body),
    onSuccess: invalidate,
  })
  const verify = useMutation({
    mutationFn: ({ id, body }: { id: Id; body: FindingVerifyRequest }) => findingsApi.verify(id, body),
    onSuccess: invalidate,
  })

  return { confirm, appeal, submitReview, concludeAppeal, remediationPlan, submitRemediation, verify }
}
