import type { CompanyListParams, OrgUnitListParams } from '@/features/organizations/organizations.types'

/** Query key của module organizations. Sau khi ghi dữ liệu: invalidateQueries({ queryKey: organizationKeys.all }). */
export const organizationKeys = {
  all: ['organizations'] as const,
  companies: (params: CompanyListParams) => [...organizationKeys.all, 'companies', params] as const,
  orgUnits: (params: OrgUnitListParams) => [...organizationKeys.all, 'org-units', params] as const,
}
