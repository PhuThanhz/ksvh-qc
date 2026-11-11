import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { usersApi } from '@/features/users/api/users.api'
import { userKeys } from '@/features/users/api/users.keys'
import type { UserListParams } from '@/features/users/users.types'

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData, // giữ trang cũ khi chuyển trang, tránh nháy bảng
  })
}
