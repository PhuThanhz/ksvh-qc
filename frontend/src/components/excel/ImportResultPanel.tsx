import { DownloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Flex, Row, Statistic, Table, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import type { ImportResult, ImportRowError } from '@/types/api.generated'
import { exportToCsv } from '@/utils/export-csv'

export interface ImportResultPanelProps {
  result: ImportResult
  fileName: string
}

const STATS = [
  { key: 'totalRows', label: 'Tổng số dòng', color: undefined },
  { key: 'created', label: 'Thêm mới', color: '#1D6F42' },
  { key: 'updated', label: 'Cập nhật', color: '#1677FF' },
] as const

/** Bước 2 của nhập Excel: thống kê và danh sách lỗi theo sheet / dòng / cột. */
export function ImportResultPanel({ result, fileName }: ImportResultPanelProps) {
  const errors = result.errors
  const sheetFilters = useMemo(
    () => [...new Set(errors.map((e) => e.sheet))].map((s) => ({ text: s, value: s })),
    [errors],
  )
  const errorRows = useMemo(() => new Set(errors.map((e) => `${e.sheet}#${e.row}`)).size, [errors])

  const downloadErrors = () =>
    exportToCsv(`loi-nhap-${fileName.replace(/\.xlsx$/i, '')}`, [
      { header: 'Sheet', accessor: (e: ImportRowError) => e.sheet },
      { header: 'Dòng', accessor: (e: ImportRowError) => e.row },
      { header: 'Cột', accessor: (e: ImportRowError) => e.column ?? '' },
      { header: 'Lỗi', accessor: (e: ImportRowError) => e.message },
    ], errors)

  return (
    <Flex vertical gap={16}>
      <Row gutter={12}>
        {STATS.map((s) => (
          <Col span={6} key={s.key}>
            <Card size="small">
              <Statistic title={s.label} value={result[s.key]} styles={{ content: { color: s.color, fontWeight: 600 } }} />
            </Card>
          </Col>
        ))}
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Dòng có lỗi"
              value={errorRows}
              styles={{ content: { color: errorRows > 0 ? '#CF1322' : '#1D6F42', fontWeight: 600 } }}
            />
          </Card>
        </Col>
      </Row>

      {errors.length === 0 ? (
        <Alert
          type="success"
          showIcon
          title="File hợp lệ"
          description={`Sẵn sàng thêm mới ${result.created} và cập nhật ${result.updated} bản ghi. Bấm "Nhập dữ liệu" để ghi vào hệ thống.`}
        />
      ) : (
        <Alert
          type="error"
          showIcon
          title={`Có ${errors.length} lỗi ở ${errorRows} dòng – chưa có dữ liệu nào được ghi`}
          description="Sửa các dòng bên dưới trong file Excel rồi chọn lại file. Số dòng khớp với số dòng hiển thị trong Excel."
          action={
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadErrors}>
              Tải danh sách lỗi
            </Button>
          }
        />
      )}

      {errors.length > 0 && (
        <Table<ImportRowError>
          size="small"
          rowKey={(e) => `${e.sheet}-${e.row}-${e.column ?? ''}-${e.message}`}
          dataSource={errors}
          pagination={{ pageSize: 8, size: 'small', showSizeChanger: false, showTotal: (t) => `${t} lỗi` }}
          columns={[
            {
              title: 'Sheet',
              dataIndex: 'sheet',
              width: 170,
              filters: sheetFilters,
              onFilter: (v, e) => e.sheet === v,
              render: (s: string) => <Tag>{s}</Tag>,
            },
            { title: 'Dòng', dataIndex: 'row', width: 70, align: 'right', sorter: (a, b) => a.row - b.row },
            {
              title: 'Cột',
              dataIndex: 'column',
              width: 160,
              render: (c?: string | null) => (c ? <Typography.Text strong>{c}</Typography.Text> : <Typography.Text type="secondary">Cả dòng</Typography.Text>),
            },
            { title: 'Nội dung lỗi', dataIndex: 'message' },
          ]}
        />
      )}
    </Flex>
  )
}
