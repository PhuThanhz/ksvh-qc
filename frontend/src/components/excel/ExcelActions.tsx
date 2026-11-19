import { CloudUploadOutlined, DownOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons'
import { Button, Dropdown, type MenuProps, Space, Tooltip } from 'antd'
import { useState } from 'react'
import { ExcelImportModal } from '@/components/excel/ExcelImportModal'
import { useNotify } from '@/components/feedback/useNotify'
import { useIsMobile } from '@/hooks/useIsMobile'
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
  /**
   * 'dropdown' (mặc định – chuẩn toàn hệ thống): 1 nút "Excel ▾" ở đầu trang
   * 'buttons': hiển thị riêng 3 nút (chỉ dùng khi thật cần)
   * 'auto': gom thành dropdown trên màn hình nhỏ (< 768px)
   */
  mode?: 'dropdown' | 'buttons' | 'auto'
}

/** Nhóm nút Excel dùng chung cho các danh mục: Nhập Excel, File mẫu (tải file mẫu nhập), Xuất Excel. */
export function ExcelActions(props: ExcelActionsProps) {
  const {
    importTitle,
    sheets,
    onExport,
    onDownloadTemplate,
    onUpload,
    onImported,
    canImport,
    errorMessage,
    mode = 'dropdown',
  } = props

  const isMobile = useIsMobile()
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
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

  const downloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      await onDownloadTemplate()
      notify.success('Đã tải file mẫu nhập Excel')
    } catch (err) {
      notify.error(errorMessage(err))
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const useDropdown = mode === 'dropdown' || (mode === 'auto' && isMobile)

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'export',
      icon: <FileExcelOutlined style={{ color: '#217346' }} />,
      label: 'Xuất file Excel (.xlsx)',
      disabled: exporting,
      onClick: () => void exportFile(),
    },
    ...(canImport
      ? [
          { type: 'divider' as const },
          {
            key: 'import',
            icon: <CloudUploadOutlined style={{ color: '#1677ff' }} />,
            label: 'Nhập dữ liệu từ Excel...',
            onClick: () => setImportOpen(true),
          },
          {
            key: 'template',
            icon: <DownloadOutlined style={{ color: '#fa8c16' }} />,
            label: 'Tải file Excel mẫu (.xlsx)',
            disabled: downloadingTemplate,
            onClick: () => void downloadTemplate(),
          },
        ]
      : []),
  ]

  return (
    <>
      {useDropdown ? (
        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight" trigger={['click']}>
          <Button
            className="btn-tint-excel"
            icon={<FileExcelOutlined />}
            loading={exporting || downloadingTemplate}
            style={{ fontWeight: 500 }}
          >
            Excel <DownOutlined style={{ fontSize: 10, marginLeft: 2 }} />
          </Button>
        </Dropdown>
      ) : (
        <Space size={8} wrap>
          {canImport && (
            <Tooltip title="Thêm / cập nhật hàng loạt từ file Excel">
              <Button className="btn-tint-excel" icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>
                Nhập Excel
              </Button>
            </Tooltip>
          )}
          {canImport && (
            <Tooltip title="Tải file Excel mẫu đúng cột để điền rồi nhập">
              <Button icon={<DownloadOutlined />} loading={downloadingTemplate} onClick={() => void downloadTemplate()}>
                File mẫu
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Tải toàn bộ dữ liệu ra file Excel (.xlsx)">
            <Button
              className="btn-tint-excel"
              icon={<FileExcelOutlined />}
              loading={exporting}
              onClick={() => void exportFile()}
            >
              Xuất Excel
            </Button>
          </Tooltip>
        </Space>
      )}

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
