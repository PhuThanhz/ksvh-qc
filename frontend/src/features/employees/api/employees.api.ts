import type { Employee, EmployeeListParams, EmployeePayload } from '@/features/employees/employees.types'
import { api, downloadFile, uploadExcel } from '@/lib/http'
import type { Id, PageResponse } from '@/types/common.types'

const PATH = {
  excelExport: '/employees/export',
  excelTemplate: '/employees/import-template',
  excelImport: '/employees/import',
  list: '/employees',
  employee: (id: Id) => `/employees/${id}`,
} as const

export const employeesApi = {
  list: ({ keyword, ...rest }: EmployeeListParams) =>
    api.get<PageResponse<Employee>>(PATH.list, { params: { ...rest, keyword: keyword || undefined } }).then((r) => r.data),
  create: (body: EmployeePayload) => api.post<Employee>(PATH.list, body).then((r) => r.data),
  update: (id: Id, body: EmployeePayload) => api.put<Employee>(PATH.employee(id), body).then((r) => r.data),
  delete: (id: Id) => api.delete<void>(PATH.employee(id)).then((r) => r.data),
}

/** Nhập / xuất Excel hồ sơ nhân viên. */
export const employeesExcelApi = {
  export: () => downloadFile(PATH.excelExport),
  template: () => downloadFile(PATH.excelTemplate),
  import: (file: File, commit: boolean) => uploadExcel(PATH.excelImport, file, commit),
}
