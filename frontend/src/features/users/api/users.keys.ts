import type { UserListParams } from '@/features/users/users.types'

/** Query key của module users. Sau khi ghi dữ liệu: invalidateQueries({ queryKey: userKeys.all }). */
export const userKeys = {
  all: ['users'] as const,
  list: (params: UserListParams) => [...userKeys.all, 'list', params] as const,
}
