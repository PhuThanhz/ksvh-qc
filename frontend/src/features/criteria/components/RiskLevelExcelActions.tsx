import { useQueryClient } from '@tanstack/react-query'
import { ExcelActions } from '@/components/excel'
import { riskLevelExcelApi } from '@/features/criteria/api/criteria.api'
import { criteriaKeys } from '@/features/criteria/api/criteria.keys'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Nhóm nút Excel cho bảng phân loại rủi ro: Nhập Excel, File mẫu, Xuất Excel. */
export function RiskLevelExcelActions() {
  const qc = useQueryClient()
  const { can } = usePermission()

  return (
    <ExcelActions
      importTitle="Nhập bảng phân loại rủi ro từ Excel"
      sheets={['Phân loại rủi ro']}
      onExport={riskLevelExcelApi.exportRiskLevels}
      onDownloadTemplate={riskLevelExcelApi.riskLevelsTemplate}
      onUpload={riskLevelExcelApi.importRiskLevels}
      onImported={() => void qc.invalidateQueries({ queryKey: criteriaKeys.all })}
      canImport={can(PERMISSIONS.CRITERIA.MANAGE)}
      errorMessage={getErrorMessage}
    />
  )
}
