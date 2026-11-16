import type { PermissionInfo, Role, RolePayload } from '@/features/roles/roles.types'
import { api } from '@/lib/http'
import type { Id } from '@/types/common.types'

const PATH = {
  permissions: '/permissions',
  roles: '/roles',
  role: (id: Id) => `/roles/${id}`,
} as const

export const rolesApi = {
  permissions: () => api.get<PermissionInfo[]>(PATH.permissions).then((r) => r.data),
  list: () => api.get<Role[]>(PATH.roles).then((r) => r.data),
  create: (body: RolePayload) => api.post<Role>(PATH.roles, body).then((r) => r.data),
  update: (id: Id, body: RolePayload) => api.put<Role>(PATH.role(id), body).then((r) => r.data),
  remove: (id: Id) => api.delete<void>(PATH.role(id)).then(() => undefined),
}
