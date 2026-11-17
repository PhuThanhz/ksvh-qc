import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_CATALOG_MS } from '@/constants/app.constants'
import { companiesApi, orgUnitsApi } from '@/features/organizations/api/organizations.api'
import { organizationKeys } from '@/features/organizations/api/organizations.keys'
import type {
  CompanyListParams,
  CompanyPayload,
  OrgUnitListParams,
  OrgUnitPayload,
} from '@/features/organizations/organizations.types'
import type { Id } from '@/types/common.types'

export function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: organizationKeys.companies(params),
    queryFn: () => companiesApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_CATALOG_MS,
  })
}

export function useOrgUnits(params: OrgUnitListParams) {
  return useQuery({
    queryKey: organizationKeys.orgUnits(params),
    queryFn: () => orgUnitsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_CATALOG_MS,
  })
}

/** Tạo mới (id = undefined) hoặc cập nhật công ty. Đổi công ty ảnh hưởng tên hiển thị ở đơn vị nên làm mới cả module. */
export function useSaveCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: CompanyPayload }) =>
      id === undefined ? companiesApi.create(body) : companiesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => companiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}

export function useSaveOrgUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: OrgUnitPayload }) =>
      id === undefined ? orgUnitsApi.create(body) : orgUnitsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}

export function useDeleteOrgUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => orgUnitsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}
