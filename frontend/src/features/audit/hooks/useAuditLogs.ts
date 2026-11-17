import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/features/audit/api/audit.api'
import type { AuditLogSearchParams } from '@/features/audit/audit.types'

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params?: AuditLogSearchParams) => [...auditKeys.all, 'list', params] as const,
  detail: (id?: number) => [...auditKeys.all, 'detail', id] as const,
  actions: () => [...auditKeys.all, 'actions'] as const,
  targetTypes: () => [...auditKeys.all, 'target-types'] as const,
}

export function useAuditLogs(params?: AuditLogSearchParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.search(params),
  })
}

export function useAuditLog(id?: number) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => (id ? auditApi.get(id) : null),
    enabled: Boolean(id),
  })
}

export function useAuditActions() {
  return useQuery({
    queryKey: auditKeys.actions(),
    queryFn: auditApi.getActions,
    staleTime: 60_000,
  })
}

export function useAuditTargetTypes() {
  return useQuery({
    queryKey: auditKeys.targetTypes(),
    queryFn: auditApi.getTargetTypes,
    staleTime: 60_000,
  })
}
