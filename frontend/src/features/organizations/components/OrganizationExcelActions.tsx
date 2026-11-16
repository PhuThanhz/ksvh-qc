import { useQueryClient } from '@tanstack/react-query'
import { ExcelActions } from '@/components/excel'
import { organizationExcelApi } from '@/features/organizations/api/organizations.api'
import { organizationKeys } from '@/features/organizations/api/organizations.keys'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Nhập / xuất Excel công ty và nhà hàng / phòng ban. */
export function OrganizationExcelActions() {
  const qc = useQueryClient()
  const { can } = usePermission()
  return (
    <ExcelActions
      importTitle="Nhập công ty, nhà hàng & phòng ban từ Excel"
      sheets={['Công ty', 'Nhà hàng - Phòng ban']}
      onExport={organizationExcelApi.export}
      onDownloadTemplate={organizationExcelApi.template}
      onUpload={organizationExcelApi.import}
      onImported={() => void qc.invalidateQueries({ queryKey: organizationKeys.all })}
      canImport={can(PERMISSIONS.ORGANIZATION.MANAGE)}
      errorMessage={getErrorMessage}
    />
  )
}
