import type {
  CriteriaViolationReportResponse,
  InspectorProductivityReportResponse,
  MonthlySummaryReportResponse,
  RemediationStatusReportResponse,
  ReportFilter,
  RestaurantRankingReportResponse,
} from '@/features/reports/report.types'
import { api, downloadFile } from '@/lib/http'

const cleanParams = (f?: ReportFilter) => {
  if (!f) return undefined
  const p: Record<string, unknown> = {}
  if (f.from) p.from = f.from
  if (f.to) p.to = f.to
  if (f.companyId) p.companyId = f.companyId
  if (f.restaurantId) p.restaurantId = f.restaurantId
  if (f.inspectorId) p.inspectorId = f.inspectorId
  if (f.groupId) p.groupId = f.groupId
  return p
}

export const reportApi = {
  // 1. Tổng hợp theo tháng
  getMonthlySummary: (filter?: ReportFilter) =>
    api.get<MonthlySummaryReportResponse>('/reports/monthly-summary', { params: cleanParams(filter) }).then((r) => r.data),

  exportMonthlySummaryExcel: (filter?: ReportFilter) =>
    downloadFile('/reports/monthly-summary/export-excel', cleanParams(filter), 'Bao-cao-tong-hop-thang.xlsx'),

  // 2. Xếp hạng nhà hàng
  getRestaurantRankings: (filter?: ReportFilter) =>
    api.get<RestaurantRankingReportResponse>('/reports/restaurant-rankings', { params: cleanParams(filter) }).then((r) => r.data),

  exportRestaurantRankingsExcel: (filter?: ReportFilter) =>
    downloadFile('/reports/restaurant-rankings/export-excel', cleanParams(filter), 'Xep-hang-nha-hang.xlsx'),

  // 3. Phân tích lỗi theo tiêu chí (Pareto)
  getCriteriaViolations: (filter?: ReportFilter) =>
    api.get<CriteriaViolationReportResponse>('/reports/criteria-violations', { params: cleanParams(filter) }).then((r) => r.data),

  exportCriteriaViolationsExcel: (filter?: ReportFilter) =>
    downloadFile('/reports/criteria-violations/export-excel', cleanParams(filter), 'Loi-theo-tieu-chi.xlsx'),

  // 4. Tiến độ & tình trạng khắc phục lỗi
  getRemediations: (filter?: ReportFilter) =>
    api.get<RemediationStatusReportResponse>('/reports/remediations', { params: cleanParams(filter) }).then((r) => r.data),

  exportRemediationsExcel: (filter?: ReportFilter) =>
    downloadFile('/reports/remediations/export-excel', cleanParams(filter), 'Tien-do-khac-phuc.xlsx'),

  // 5. Năng suất chuyên viên KSVH
  getInspectorProductivity: (filter?: ReportFilter) =>
    api.get<InspectorProductivityReportResponse>('/reports/inspector-productivity', { params: cleanParams(filter) }).then((r) => r.data),

  exportInspectorProductivityExcel: (filter?: ReportFilter) =>
    downloadFile('/reports/inspector-productivity/export-excel', cleanParams(filter), 'Nang-suat-chuyen-vien.xlsx'),

  // 6. Xuất PDF phiếu chấm và Biên bản sự cố M4
  exportInspectionPdf: (inspectionId: number) =>
    downloadFile(`/reports/inspections/${inspectionId}/export-pdf`, undefined, `Phieu-kiem-tra-${inspectionId}.pdf`),

  exportM4FindingPdf: (findingId: number) =>
    downloadFile(`/reports/findings/${findingId}/export-m4-pdf`, undefined, `Bien-ban-vi-pham-M4-${findingId}.pdf`),
}
