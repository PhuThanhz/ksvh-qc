import { useQueryClient } from '@tanstack/react-query'
import { ExcelActions } from '@/components/excel'
import { usersExcelApi } from '@/features/users/api/users.api'
import { userKeys } from '@/features/users/api/users.keys'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'

/** Nhập / xuất Excel tài khoản người dùng (file xuất không có mật khẩu). */
export function UserExcelActions() {
  const qc = useQueryClient()
  const { can } = usePermission()
  return (
    <ExcelActions
      importTitle="Nhập tài khoản người dùng từ Excel"
      sheets={['Người dùng']}
      onExport={usersExcelApi.export}
      onDownloadTemplate={usersExcelApi.template}
      onUpload={usersExcelApi.import}
      onImported={() => void qc.invalidateQueries({ queryKey: userKeys.all })}
      canImport={can(PERMISSIONS.USER.MANAGE)}
      errorMessage={getErrorMessage}
    />
  )
}
