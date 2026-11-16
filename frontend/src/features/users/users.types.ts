import type { components } from '@/types/api.generated'
import type { PageParams } from '@/types/common.types'

type Schemas = components['schemas']

export type User = Schemas['UserResponse']
export type UserCreatePayload = Schemas['UserCreateRequest']
export type UserUpdatePayload = Schemas['UserUpdateRequest']
export type PasswordResetPayload = Schemas['PasswordResetRequest']

export interface UserListParams extends PageParams {
  keyword?: string
  /** Lọc theo mã role (vd STORE_MANAGER khi chọn Cửa hàng trưởng). */
  role?: string
  active?: boolean
}
