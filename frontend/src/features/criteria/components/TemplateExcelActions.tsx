import { useQueryClient } from '@tanstack/react-query'
import { ExcelActions } from '@/components/excel'
import { criteriaExcelApi } from '@/features/criteria/api/criteria.api'
import { criteriaKeys } from '@/features/criteria/api/criteria.keys'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Nhập / xuất Excel mẫu phiếu chấm và danh sách tiêu chí của từng mẫu. */
export function TemplateExcelActions() {
  const qc = useQueryClient()
  const { can } = usePermission()
  return (
    <ExcelActions
      importTitle="Nhập mẫu phiếu chấm từ Excel"
      sheets={['Mẫu phiếu', 'Tiêu chí trong mẫu']}
      onExport={criteriaExcelApi.exportTemplates}
      onDownloadTemplate={criteriaExcelApi.templatesTemplate}
      onUpload={criteriaExcelApi.importTemplates}
      onImported={() => void qc.invalidateQueries({ queryKey: criteriaKeys.all })}
      canImport={can(PERMISSIONS.CRITERIA.MANAGE)}
      errorMessage={getErrorMessage}
    />
  )
}
