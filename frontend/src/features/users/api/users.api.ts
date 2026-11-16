import type {
  PasswordResetPayload,
  User,
  UserCreatePayload,
  UserListParams,
  UserUpdatePayload,
} from '@/features/users/users.types'
import { api, downloadFile, uploadExcel } from '@/lib/http'
import type { Id, PageResponse } from '@/types/common.types'

const PATH = {
  excelExport: '/users/export',
  excelTemplate: '/users/import-template',
  excelImport: '/users/import',
  list: '/users',
  user: (id: Id) => `/users/${id}`,
  resetPassword: (id: Id) => `/users/${id}/reset-password`,
} as const

export const usersApi = {
  list: ({ keyword, role, active, ...page }: UserListParams) =>
    api
      .get<PageResponse<User>>(PATH.list, {
        params: { ...page, keyword: keyword || undefined, role: role || undefined, active },
      })
      .then((r) => r.data),
  create: (body: UserCreatePayload) => api.post<User>(PATH.list, body).then((r) => r.data),
  update: (id: Id, body: UserUpdatePayload) => api.put<User>(PATH.user(id), body).then((r) => r.data),
  resetPassword: (id: Id, body: PasswordResetPayload) =>
    api.post<void>(PATH.resetPassword(id), body).then(() => undefined),
  delete: (id: Id) => api.delete(PATH.user(id)).then(() => undefined),
}

/** Nhập / xuất Excel tài khoản (file xuất không chứa mật khẩu). */
export const usersExcelApi = {
  export: () => downloadFile(PATH.excelExport),
  template: () => downloadFile(PATH.excelTemplate),
  import: (file: File, commit: boolean) => uploadExcel(PATH.excelImport, file, commit),
}
