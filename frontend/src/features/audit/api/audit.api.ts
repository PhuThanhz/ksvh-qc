import { api } from '@/lib/http'
import type { PageAuditLogResponse } from '@/types/api.generated'
import type { AuditLogResponse, AuditLogSearchParams } from '@/features/audit/audit.types'

const data = <T>(r: { data: T }) => r.data

export const auditApi = {
  search: (params?: AuditLogSearchParams) =>
    api.get<PageAuditLogResponse>('/audit-logs', { params }).then(data),

  get: (id: number) =>
    api.get<AuditLogResponse>(`/audit-logs/${id}`).then(data),

  getActions: () =>
    api.get<string[]>('/audit-logs/actions').then(data),

  getTargetTypes: () =>
    api.get<string[]>('/audit-logs/target-types').then(data),
}
