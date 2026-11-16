import { CloudUploadOutlined, FileExcelOutlined } from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd'
import { useState } from 'react'
import { EXCEL_GREEN } from '@/components/excel/excel.constants'
import { ExcelImportModal } from '@/components/excel/ExcelImportModal'
import { useNotify } from '@/components/feedback/useNotify'
import type { ImportResult } from '@/types/api.generated'

export interface ExcelActionsProps {
  /** Tiêu đề hộp thoại nhập, vd "Nhập danh mục tiêu chí". */
  importTitle: string
  sheets?: readonly string[]
  /** Trả về tên file đã tải. */
  onExport: () => Promise<string>
  onDownloadTemplate: () => Promise<unknown>
  onUpload: (file: File, commit: boolean) => Promise<ImportResult>
  onImported?: (result: ImportResult) => void
  /** Ẩn nút nhập khi không có quyền ghi. */
  canImport: boolean
  errorMessage: (err: unknown) => string
}

/** Cặp nút "Nhập Excel" / "Xuất Excel" dùng chung cho các danh mục. */
export function ExcelActions(props: ExcelActionsProps) {
  const { importTitle, sheets, onExport, onDownloadTemplate, onUpload, onImported, canImport, errorMessage } = props
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const exportFile = async () => {
    setExporting(true)
    try {
      const name = await onExport()
      notify.success(`Đã xuất file ${name}`)
    } catch (err) {
      notify.error(errorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Space size={8}>
        {canImport && (
          <Tooltip title="Thêm / cập nhật hàng loạt từ file Excel">
            <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>
              Nhập Excel
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Tải toàn bộ dữ liệu ra file Excel (.xlsx)">
          <Button icon={<FileExcelOutlined style={{ color: EXCEL_GREEN }} />} loading={exporting} onClick={() => void exportFile()}>
            Xuất Excel
          </Button>
        </Tooltip>
      </Space>
      {canImport && (
        <ExcelImportModal
          open={importOpen}
          title={importTitle}
          sheets={sheets}
          onDownloadTemplate={onDownloadTemplate}
          onUpload={onUpload}
          onImported={onImported}
          onClose={() => setImportOpen(false)}
          errorMessage={errorMessage}
        />
      )}
    </>
  )
}
