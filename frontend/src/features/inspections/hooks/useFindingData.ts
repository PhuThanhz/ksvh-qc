import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { findingsApi } from '@/features/inspections/api/inspection.api'
import type {
  AppealReviewRequest,
  FindingAppealRequest,
  FindingConcludeAppealRequest,
  FindingRemediationPlanRequest,
  FindingStatus,
  FindingSubmitRemediationRequest,
  FindingVerifyRequest,
} from '@/features/inspections/inspection.types'
import type { Id } from '@/types/common.types'
import { inspectionKeys } from './useInspectionData'

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
