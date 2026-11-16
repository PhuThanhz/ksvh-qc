import type { components } from '@/types/api.generated'
import type { PageParams } from '@/types/common.types'

export type Employee = components['schemas']['EmployeeResponse']
export type EmployeePayload = components['schemas']['EmployeeRequest']

export interface EmployeeListParams extends PageParams {
  keyword?: string
  orgUnitId?: number
  active?: boolean
}
