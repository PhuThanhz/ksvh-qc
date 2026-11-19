import { FileExcelOutlined } from '@ant-design/icons'
import { Button, Flex, Progress, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { TableCard } from '@/components/data-display/TableCard'
import { useNotify } from '@/components/feedback/useNotify'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { useInspectorProductivity } from '@/features/reports/hooks/useReports'
import { reportApi } from '@/features/reports/api/report.api'
import type { InspectorProductivityItem, ReportFilter } from '@/features/reports/report.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function InspectorProductivityTab() {
  const [filter, setFilter] = useState<ReportFilter>({})
  const { data, isLoading } = useInspectorProductivity(filter)
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)

  const items = data?.items ?? []

  const handleExport = async () => {
    setExporting(true)
    try {
      const name = await reportApi.exportInspectorProductivityExcel(filter)
      notify.success(`Đã xuất báo cáo ${name}`)
    } catch {
      notify.error('Không thể xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  const columns: ColumnsType<InspectorProductivityItem> = [
    {
      title: 'Chuyên viên KSVH',
      key: 'inspector',
      width: 200,
      render: (_, r) => (
        <div>
          <b>{r.inspectorFullName}</b>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>@{r.inspectorUsername}</div>
        </div>
      ),
    },
    { title: 'Phiếu được giao', dataIndex: 'totalAssigned', key: 'totalAssigned', align: 'right', width: 130 },
    { title: 'Phiếu hoàn thành', dataIndex: 'completedInspections', key: 'completedInspections', align: 'right', width: 140 },
    {
      title: 'Tỷ lệ hoàn thành',
      key: 'completionRate',
      width: 150,
      render: (_, r) => {
        const rate = r.totalAssigned > 0 ? (r.completedInspections / r.totalAssigned) * 100 : 0
        return <Progress percent={Number(rate.toFixed(0))} size="small" />
      },
    },
    {
      title: 'Thời lượng TB (phút)',
      dataIndex: 'avgDurationMinutes',
      key: 'avgDurationMinutes',
      align: 'right',
      width: 150,
      render: (v: number) => (v > 0 ? `${v.toFixed(0)} phút` : '—'),
    },
    {
      title: 'Tổng lỗi phát hiện',
      dataIndex: 'totalFindingsFound',
      key: 'totalFindingsFound',
      align: 'right',
      width: 140,
    },
    {
      title: 'Lỗi M3 - M4',
      dataIndex: 'm3m4Count',
      key: 'm3m4Count',
      align: 'right',
      width: 110,
      render: (v: number) => (v > 0 ? <b style={{ color: '#ff4d4f' }}>{v}</b> : 0),
    },
    {
      title: 'Lỗi TB / phiếu',
      dataIndex: 'avgFindingsPerInspection',
      key: 'avgFindingsPerInspection',
      align: 'right',
      width: 130,
      render: (v: number) => v.toFixed(1),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <ReportFilterBar filter={filter} onChange={setFilter} showRestaurant={false} />
        <ProtectedAction access={{ anyOf: [PERMISSIONS.REPORT.EXPORT, PERMISSIONS.REPORT.READ] }}>
          <Button
            className="btn-tint-excel"
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>
        </ProtectedAction>
      </Flex>

      <TableCard>
        <Flex justify="space-between" align="center" style={{ borderBottom: '1px solid #eef2f6' }}>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>
            Năng suất & Thời lượng chấm kiểm soát của chuyên viên KSVH
          </Typography.Title>
          <span style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
            Tổng số: <b>{items.length}</b> chuyên viên
          </span>
        </Flex>
        <Table
          rowKey="inspectorId"
          dataSource={items}
          columns={columns}
          loading={isLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </TableCard>
    </Flex>
  )
}
