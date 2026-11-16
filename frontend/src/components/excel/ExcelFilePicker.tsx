import { CheckCircleFilled, DownloadOutlined, FileExcelTwoTone, InboxOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography, Upload } from 'antd'
import { EXCEL_ACCEPT, EXCEL_GREEN, EXCEL_MAX_BYTES } from '@/components/excel/excel.constants'

export interface ExcelFilePickerProps {
  sheets?: readonly string[]
  downloading: boolean
  validating: boolean
  onDownloadTemplate: () => void
  onPick: (file: File) => void
  onInvalid: (message: string) => void
}

const RULES = [
  'Dùng đúng file mẫu: giữ nguyên tên sheet và tiêu đề cột (cột có dấu * là bắt buộc).',
  'Mã đã có trong hệ thống sẽ được cập nhật, mã mới sẽ được thêm.',
  'Hệ thống kiểm tra toàn bộ file trước; có lỗi ở bất kỳ dòng nào thì chưa ghi gì cả.',
]

/** Bước 1 của nhập Excel: tải file mẫu và chọn file (.xlsx, ≤ 5 MB). */
export function ExcelFilePicker({ sheets, downloading, validating, onDownloadTemplate, onPick, onInvalid }: ExcelFilePickerProps) {
  return (
    <Flex vertical gap={16}>
      <Card size="small" styles={{ body: { padding: 16 } }}>
        <Flex align="center" gap={16} wrap>
          <FileExcelTwoTone twoToneColor={EXCEL_GREEN} style={{ fontSize: 36 }} />
          <Flex vertical flex={1} style={{ minWidth: 220 }}>
            <Typography.Text strong>Bước 1 · Tải file mẫu</Typography.Text>
            <Typography.Text type="secondary">
              File có sheet Hướng dẫn, ô chọn sẵn giá trị và ghi chú ở từng cột
              {sheets && sheets.length > 0 ? ` · Gồm: ${sheets.join(', ')}` : ''}.
            </Typography.Text>
          </Flex>
          <Button icon={<DownloadOutlined />} loading={downloading} onClick={onDownloadTemplate}>
            Tải file mẫu
          </Button>
        </Flex>
      </Card>

      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          Bước 2 · Chọn file đã điền dữ liệu
        </Typography.Text>
        <Upload.Dragger
          accept={EXCEL_ACCEPT}
          multiple={false}
          showUploadList={false}
          disabled={validating}
          beforeUpload={(file) => {
            if (!file.name.toLowerCase().endsWith('.xlsx')) onInvalid('Chỉ nhận file Excel .xlsx')
            else if (file.size > EXCEL_MAX_BYTES) onInvalid('File vượt quá 5 MB, hãy chia nhỏ file')
            else onPick(file)
            return false
          }}
          style={{ padding: '12px 0' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: EXCEL_GREEN }} />
          </p>
          <p className="ant-upload-text">{validating ? 'Đang kiểm tra file…' : 'Kéo thả file vào đây hoặc bấm để chọn'}</p>
          <p className="ant-upload-hint">Định dạng .xlsx · Tối đa 5 MB · Tối đa 5.000 dòng mỗi sheet</p>
        </Upload.Dragger>
      </div>

      <Flex vertical gap={6}>
        {RULES.map((r) => (
          <Typography.Text key={r} type="secondary" style={{ fontSize: 13 }}>
            <CheckCircleFilled style={{ color: EXCEL_GREEN, marginRight: 8 }} />
            {r}
          </Typography.Text>
        ))}
      </Flex>
    </Flex>
  )
}
