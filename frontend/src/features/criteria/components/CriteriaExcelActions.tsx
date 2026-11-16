import { useQueryClient } from '@tanstack/react-query'
import { ExcelActions } from '@/components/excel'
import { criteriaExcelApi } from '@/features/criteria/api/criteria.api'
import { criteriaKeys } from '@/features/criteria/api/criteria.keys'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Nhập / xuất Excel nhóm tiêu chí và tiêu chí (một file hai sheet). */
export function CriteriaExcelActions() {
  const qc = useQueryClient()
  const { can } = usePermission()
  return (
    <ExcelActions
      importTitle="Nhập nhóm tiêu chí & tiêu chí từ Excel"
      sheets={['Nhóm tiêu chí', 'Tiêu chí']}
      onExport={criteriaExcelApi.exportCriteria}
      onDownloadTemplate={criteriaExcelApi.criteriaTemplate}
      onUpload={criteriaExcelApi.importCriteria}
      onImported={() => void qc.invalidateQueries({ queryKey: criteriaKeys.all })}
      canImport={can(PERMISSIONS.CRITERIA.MANAGE)}
      errorMessage={getErrorMessage}
    />
  )
}
