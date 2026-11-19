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

export type RiskPolicy = Schemas['OrgUnitResponse']['riskPolicy']

/** Ngưỡng nâng / hạ mức của từng chính sách khai báo ở trang Quy tắc tái phạm & nâng mức (theo ngày hiệu lực). */
export const RISK_POLICY_LABEL: Record<RiskPolicy, string> = {
  STANDARD: 'Tiêu chuẩn',
  STRICT: 'Khắt khe (Fine dining)',
}

export const RISK_POLICY_OPTIONS = (Object.keys(RISK_POLICY_LABEL) as RiskPolicy[]).map((value) => ({
  value,
  label: RISK_POLICY_LABEL[value],
}))

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
