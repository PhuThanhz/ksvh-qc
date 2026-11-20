import type { components } from '@/types/api.generated'
import type { PageParams } from '@/types/common.types'

type Schemas = components['schemas']

export type Company = Schemas['CompanyResponse']
export type CompanyPayload = Schemas['CompanyRequest']
export type UserRef = Schemas['UserRef']
export type OrgUnitType = Schemas['OrgUnitResponse']['unitType']
export type RestaurantAssignment = Schemas['RestaurantAssignmentResponse']
export type RestaurantAssignmentPayload = Schemas['RestaurantAssignmentRequest']
export type AssignedRestaurant = Schemas['AssignedRestaurant']

export type EscalationOverride = Pick<OrgUnit, 'escalationThreshold' | 'escalationResetMonths' | 'escalationStep'>

/** Nhà hàng có khai báo ít nhất một thông số nâng / hạ mức riêng. */
export const hasEscalationOverride = (u: EscalationOverride) =>
  u.escalationThreshold != null || u.escalationStep != null || u.escalationResetMonths != null

/** Ngưỡng nâng / hạ mức riêng của nhà hàng; trống = theo quy tắc chung (trang Quy tắc tái phạm & nâng mức). */
export function escalationOverrideText(
  u: Pick<OrgUnit, 'escalationThreshold' | 'escalationResetMonths' | 'escalationStep'>,
): string | null {
  const parts = [
    u.escalationThreshold != null ? `nâng mức từ ${u.escalationThreshold} lần` : null,
    u.escalationStep != null ? `+${u.escalationStep} bậc` : null,
    u.escalationResetMonths != null ? `hạ mức sau ${u.escalationResetMonths} tháng` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

/** OpenAPI không gắn được null cho trường kiểu tham chiếu: CHT/OBM có thể chưa gán (phòng ban luôn trống). */
export type OrgUnit = Omit<Schemas['OrgUnitResponse'], 'storeManager' | 'obm'> & {
  storeManager: UserRef | null
  obm: UserRef | null
}
export type OrgUnitPayload = Schemas['OrgUnitRequest']

export interface CompanyListParams extends PageParams {
  keyword?: string
  active?: boolean
}

export interface OrgUnitListParams extends PageParams {
  keyword?: string
  companyId?: number
  unitType?: OrgUnitType
  active?: boolean
}

export const ORG_UNIT_TYPE_LABEL: Record<OrgUnitType, string> = {
  RESTAURANT: 'Nhà hàng',
  DEPARTMENT: 'Phòng ban',
}
