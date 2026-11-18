import dayjs from 'dayjs'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { exportToCsv } from '@/utils/export-csv'
import { formatDate } from '@/utils/format-date'

export function exportFindingsToCsv(list: FindingResponse[]) {
  if (list.length === 0) return
  exportToCsv(
    `danh-sach-loi-khac-phuc-${dayjs().format('YYYYMMDD')}`,
    [
      { header: 'Mã lỗi', accessor: (f) => `#${f.id}` },
      { header: 'Mã phiếu', accessor: (f) => f.inspectionCode },
      { header: 'Nhà hàng', accessor: (f) => f.restaurantName },
      { header: 'Mã tiêu chí', accessor: (f) => f.criterionCode },
      { header: 'Tiêu chí', accessor: (f) => f.criterionName },
      { header: 'Trọng số gốc', accessor: (f) => f.baseImpact },
      { header: 'Ảnh hưởng hiệu lực', accessor: (f) => f.effectiveImpact },
      { header: 'Lần vi phạm', accessor: (f) => f.violationCount },
      { header: 'Điểm rủi ro', accessor: (f) => f.calculatedScore },
      { header: 'Mức rủi ro', accessor: (f) => f.riskLevelCode },
      { header: 'Trạng thái', accessor: (f) => f.status },
      { header: 'Hạn khắc phục', accessor: (f) => formatDate(f.deadlineDate) },
      { header: 'Hẹn hoàn thành', accessor: (f) => formatDate(f.remediationTargetDate) },
    ],
    list,
  )
}
