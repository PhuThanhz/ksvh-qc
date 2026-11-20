import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inspectionsApi } from '@/features/inspections/api/inspection.api'
import type {
  InspectionCancelRequest,
  InspectionCheckinRequest,
  InspectionCreateRequest,
  InspectionBatchCreateRequest,
  InspectionStatus,
  InspectionSubmitRequest,
} from '@/features/inspections/inspection.types'
import type { Id } from '@/types/common.types'

export * from './usePlanData'
export * from './useFindingData'

export const inspectionKeys = {
  all: ['inspections'] as const,
  plans: () => [...inspectionKeys.all, 'plans'] as const,
  planList: (params?: Record<string, unknown>) => [...inspectionKeys.plans(), 'list', params] as const,
  inspectorSchedule: (from?: string, to?: string, excludePlanId?: number) =>
    [...inspectionKeys.plans(), 'inspector-schedule', from, to, excludePlanId] as const,
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
