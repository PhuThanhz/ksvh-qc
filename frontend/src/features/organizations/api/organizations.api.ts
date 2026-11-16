import type {
  Company,
  CompanyListParams,
  CompanyPayload,
  OrgUnit,
  OrgUnitListParams,
  OrgUnitPayload,
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

/** Nhập / xuất Excel công ty + nhà hàng / phòng ban (một file, hai sheet). */
export const organizationExcelApi = {
  export: () => downloadFile(PATH.excelExport),
  template: () => downloadFile(PATH.excelTemplate),
  import: (file: File, commit: boolean) => uploadExcel(PATH.excelImport, file, commit),
}
