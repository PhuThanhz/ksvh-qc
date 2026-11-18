import { FileExcelOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { EChart } from '@/components/charts/EChart'
import { TableCard } from '@/components/data-display/TableCard'
import { useNotify } from '@/components/feedback/useNotify'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { useCriteriaViolations } from '@/features/reports/hooks/useReports'
import { reportApi } from '@/features/reports/api/report.api'
import type { CriteriaViolationItem, ReportFilter } from '@/features/reports/report.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function CriteriaViolationTab() {
  const [filter, setFilter] = useState<ReportFilter>({})
  const { data, isLoading } = useCriteriaViolations(filter)
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const totalViolations = data?.totalViolations ?? 0

  const handleExport = async () => {
    setExporting(true)
    try {
      const name = await reportApi.exportCriteriaViolationsExcel(filter)
      notify.success(`Đã xuất báo cáo ${name}`)
    } catch {
      notify.error('Không thể xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  const chartOption = useMemo(() => {
    const top10 = items.slice(0, 10)
    const codes = top10.map((i) => i.criterionCode)
    const counts = top10.map((i) => i.violationCount)
    const pareto = top10.map((i) => i.paretoPercentage)

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['Số lần vi phạm', '% Luỹ kế Pareto'] },
      grid: { left: 40, right: 50, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: codes, axisLabel: { interval: 0, rotate: 20 } },
      yAxis: [
        { type: 'value', name: 'Số lần', minInterval: 1 },
        { type: 'value', name: '% Pareto', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      ],
      series: [
        { name: 'Số lần vi phạm', type: 'bar', data: counts, color: '#ff4d4f' },
        {
          name: '% Luỹ kế Pareto',
          type: 'line',
          yAxisIndex: 1,
          data: pareto,
          color: '#1890ff',
          symbolSize: 7,
          markLine: {
            data: [{ yAxis: 80, name: 'Ngưỡng 80/20' }],
            lineStyle: { color: '#fa8c16', type: 'dashed' },
          },
        },
      ],
    }
  }, [items])

  const columns: ColumnsType<CriteriaViolationItem> = [
    {
      title: 'Mã tiêu chí',
      dataIndex: 'criterionCode',
      key: 'criterionCode',
      width: 120,
      render: (v) => <b>{v}</b>,
    },
    {
      title: 'Tên tiêu chí',
      dataIndex: 'criterionName',
      key: 'criterionName',
      ellipsis: true,
      render: (v, r) => (
        <div>
          <div>{v}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>Nhóm: {r.groupName || 'Chung'}</div>
        </div>
      ),
    },
    {
      title: 'Ảnh hưởng',
      dataIndex: 'baseImpact',
      key: 'baseImpact',
      width: 95,
      align: 'center',
      render: (v: number) => <Tag color={v >= 4 ? 'error' : v >= 3 ? 'warning' : 'default'}>Mức {v}</Tag>,
    },
    {
      title: 'Số lần',
      dataIndex: 'violationCount',
      key: 'violationCount',
      width: 85,
      align: 'right',
      render: (v: number) => <b style={{ color: '#ff4d4f' }}>{v}</b>,
    },
    { title: 'Số nhà hàng', dataIndex: 'restaurantCount', key: 'restaurantCount', width: 105, align: 'right' },
    {
      title: 'Tái phạm',
      dataIndex: 'repeatCount',
      key: 'repeatCount',
      width: 90,
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: '#fa8c16' }}>{v}</b> : 0),
    },
    {
      title: 'Chưa đóng',
      dataIndex: 'openCount',
      key: 'openCount',
      width: 95,
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: '#fa8c16' }}>{v}</b> : 0),
    },
    { title: 'Đã đóng', dataIndex: 'closedCount', key: 'closedCount', width: 90, align: 'right' },
    {
      title: '% Pareto',
      dataIndex: 'paretoPercentage',
      key: 'paretoPercentage',
      width: 100,
      align: 'right',
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v.toFixed(1)}%</span>,
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <ReportFilterBar filter={filter} onChange={setFilter} showGroup />
        <ProtectedAction access={{ anyOf: [PERMISSIONS.REPORT.EXPORT, PERMISSIONS.REPORT.READ] }}>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>
        </ProtectedAction>
      </Flex>

      {items.length > 0 && (
        <Card size="small" title="Biểu đồ Pareto lỗi vi phạm (Top 10 tiêu chí phát hiện nhiều nhất)">
          <EChart option={chartOption} height={290} ariaLabel="Biểu đồ Pareto tiêu chí vi phạm" />
        </Card>
      )}

      <TableCard>
        <Flex justify="space-between" align="center" style={{ margin: '8px 0 12px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Phân tích lỗi vi phạm theo tiêu chí & tỷ lệ luỹ kế (Pareto)
          </Typography.Title>
          <span style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
            Tổng số: <b>{totalViolations}</b> lượt lỗi vi phạm trên <b>{items.length}</b> tiêu chí
          </span>
        </Flex>
        <Table
          rowKey="criterionId"
          dataSource={items}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 950 }}
        />
      </TableCard>
    </Flex>
  )
}
