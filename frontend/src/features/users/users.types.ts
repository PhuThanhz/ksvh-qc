import type { UserResponse } from '@/types/api.generated'
import type { PageParams } from '@/types/common.types'

export type User = UserResponse

export interface UserListParams extends PageParams {
  keyword?: string
}
