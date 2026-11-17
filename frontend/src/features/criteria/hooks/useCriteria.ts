import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_CATALOG_MS } from '@/constants/app.constants'
import { criteriaApi } from '@/features/criteria/api/criteria.api'
import { criteriaKeys } from '@/features/criteria/api/criteria.keys'
import type { CriterionGroupPayload, CriterionListParams, CriterionPayload } from '@/features/criteria/criteria.types'
import type { Id } from '@/types/common.types'

export function useCriterionGroups(companyId?: number) {
  return useQuery({
    queryKey: criteriaKeys.groups(companyId),
    queryFn: () => criteriaApi.groups(companyId),
    staleTime: STALE_CATALOG_MS,
  })
}

export function useCriteriaList(params: CriterionListParams) {
  return useQuery({
    queryKey: criteriaKeys.list(params),
    queryFn: () => criteriaApi.list(params),
    placeholderData: keepPreviousData,
  })
}

/** Tiêu chí đang hoạt động (để chọn vào mẫu phiếu). */
export function useCriterionOptions(enabled = true) {
  return useQuery({
    queryKey: criteriaKeys.options(),
    queryFn: criteriaApi.options,
    enabled,
    staleTime: STALE_CATALOG_MS,
  })
}

export function useSaveGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: CriterionGroupPayload }) =>
      id === undefined ? criteriaApi.createGroup(body) : criteriaApi.updateGroup(id, body),
    // Tên nhóm hiển thị trong danh sách tiêu chí → làm mới cả hai.
    onSuccess: () => qc.invalidateQueries({ queryKey: criteriaKeys.all }),
  })
}

export function useSaveCriterion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: CriterionPayload }) =>
      id === undefined ? criteriaApi.create(body) : criteriaApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.criteria() })
      void qc.invalidateQueries({ queryKey: criteriaKeys.groups() })
    },
  })
}

export function useBatchSaveCriteria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CriterionPayload[]) => criteriaApi.createBatch(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.criteria() })
      void qc.invalidateQueries({ queryKey: criteriaKeys.groups() })
    },
  })
}

export function useDeleteCriterion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => criteriaApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.criteria() })
      void qc.invalidateQueries({ queryKey: criteriaKeys.groups() })
    },
  })
}
