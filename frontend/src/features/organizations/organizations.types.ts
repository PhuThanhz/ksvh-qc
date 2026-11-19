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

export type RiskPolicy = 'STANDARD' | 'STRICT'

export const RISK_POLICY_LABEL: Record<RiskPolicy, string> = {
  STANDARD: 'Tiêu chuẩn',
  STRICT: 'Khắt khe (Fine Dining)',
}

export const RISK_POLICY_OPTIONS = [
  { value: 'STANDARD', label: 'Tiêu chuẩn (ngưỡng 3 lần vi phạm)' },
  { value: 'STRICT', label: 'Khắt khe - Fine Dining (ngưỡng 2 lần vi phạm)' },
]

/** OpenAPI không gắn được null cho trường kiểu tham chiếu: CHT/OBM có thể chưa gán (phòng ban luôn trống). */
export type OrgUnit = Omit<Schemas['OrgUnitResponse'], 'storeManager' | 'obm'> & {
  storeManager: UserRef | null
  obm: UserRef | null
  riskPolicy?: RiskPolicy
}
export type OrgUnitPayload = Schemas['OrgUnitRequest'] & {
  riskPolicy?: RiskPolicy
}

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
