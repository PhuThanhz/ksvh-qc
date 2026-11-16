import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesApi } from '@/features/roles/api/roles.api'
import { roleKeys } from '@/features/roles/api/roles.keys'
import type { RolePayload } from '@/features/roles/roles.types'
import type { Id } from '@/types/common.types'

export function useRoles() {
  return useQuery({ queryKey: roleKeys.list(), queryFn: rolesApi.list })
}

export function usePermissionCatalog() {
  return useQuery({ queryKey: roleKeys.permissions(), queryFn: rolesApi.permissions })
}

/** Đổi quyền của vai trò làm thay đổi cả ma trận permission → làm mới toàn bộ module. */
export function useSaveRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: RolePayload }) =>
      id === undefined ? rolesApi.create(body) : rolesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => rolesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  })
}
