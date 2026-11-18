import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { plansApi } from '@/features/inspections/api/inspection.api'
import type {
  PlanCreateRequest,
  PlanRejectRequest,
  PlanStatus,
  PlanUpdateRequest,
} from '@/features/inspections/inspection.types'
import type { Id } from '@/types/common.types'
import { inspectionKeys } from './useInspectionData'

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
