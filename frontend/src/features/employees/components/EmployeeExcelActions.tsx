import { useQueryClient } from '@tanstack/react-query'
import { ExcelActions } from '@/components/excel'
import { employeesExcelApi } from '@/features/employees/api/employees.api'
import { employeeKeys } from '@/features/employees/api/employees.keys'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Nhập / xuất Excel hồ sơ nhân viên. */
export function EmployeeExcelActions() {
  const qc = useQueryClient()
  const { can } = usePermission()
  return (
    <ExcelActions
      importTitle="Nhập hồ sơ nhân viên từ Excel"
      sheets={['Nhân viên']}
      onExport={employeesExcelApi.export}
      onDownloadTemplate={employeesExcelApi.template}
      onUpload={employeesExcelApi.import}
      onImported={() => void qc.invalidateQueries({ queryKey: employeeKeys.all })}
      canImport={can(PERMISSIONS.EMPLOYEE.MANAGE)}
      errorMessage={getErrorMessage}
    />
  )
}
