import type {
  Company,
  CompanyListParams,
  CompanyPayload,
  OrgUnit,
  OrgUnitListParams,
  OrgUnitPayload,
  RestaurantAssignment,
  RestaurantAssignmentPayload,
} from '@/features/organizations/organizations.types'
import { api, downloadFile, uploadExcel } from '@/lib/http'
import type { Id, PageResponse } from '@/types/common.types'

const PATH = {
  excelExport: '/organizations/export',
  excelTemplate: '/organizations/import-template',
  excelImport: '/organizations/import',
  companies: '/companies',
  company: (id: Id) => `/companies/${id}`,
  orgUnits: '/org-units',
  orgUnit: (id: Id) => `/org-units/${id}`,
  assignment: (userId: Id) => `/org-units/assignments/${userId}`,
} as const

export const companiesApi = {
  list: ({ keyword, ...rest }: CompanyListParams) =>
    api
      .get<PageResponse<Company>>(PATH.companies, { params: { ...rest, keyword: keyword || undefined } })
      .then((r) => r.data),
  create: (body: CompanyPayload) => api.post<Company>(PATH.companies, body).then((r) => r.data),
  update: (id: Id, body: CompanyPayload) => api.put<Company>(PATH.company(id), body).then((r) => r.data),
  delete: (id: Id) => api.delete(PATH.company(id)).then(() => undefined),
}

export const orgUnitsApi = {
  list: ({ keyword, ...rest }: OrgUnitListParams) =>
    api
      .get<PageResponse<OrgUnit>>(PATH.orgUnits, { params: { ...rest, keyword: keyword || undefined } })
      .then((r) => r.data),
  create: (body: OrgUnitPayload) => api.post<OrgUnit>(PATH.orgUnits, body).then((r) => r.data),
  update: (id: Id, body: OrgUnitPayload) => api.put<OrgUnit>(PATH.orgUnit(id), body).then((r) => r.data),
  delete: (id: Id) => api.delete(PATH.orgUnit(id)).then(() => undefined),
}

/** Nhà hàng một người dùng phụ trách với vai trò CHT / OBM (gán từ màn Người dùng). */
export const restaurantAssignmentsApi = {
  get: (userId: Id) => api.get<RestaurantAssignment>(PATH.assignment(userId)).then((r) => r.data),
  replace: (userId: Id, body: RestaurantAssignmentPayload) =>
    api.put<RestaurantAssignment>(PATH.assignment(userId), body).then((r) => r.data),
}

/** Nhập / xuất Excel công ty + nhà hàng / phòng ban (một file, hai sheet). */
export const organizationExcelApi = {
  export: () => downloadFile(PATH.excelExport),
  template: () => downloadFile(PATH.excelTemplate),
  import: (file: File, commit: boolean) => uploadExcel(PATH.excelImport, file, commit),
}
