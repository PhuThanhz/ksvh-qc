import type { User, UserListParams } from '@/features/users/users.types'
import { api } from '@/lib/http'
import type { PageResponse } from '@/types/common.types'

const PATH = { list: '/users' } as const

export const usersApi = {
  list: ({ keyword, ...page }: UserListParams) =>
    api.get<PageResponse<User>>(PATH.list, { params: { ...page, keyword: keyword || undefined } }).then((r) => r.data),
}
