import {
  AuditOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Flex, Row, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { EChart } from '@/components/charts/EChart'
import { KpiCard } from '@/components/data-display/KpiCard'
import { TableCard } from '@/components/data-display/TableCard'
import { useNotify } from '@/components/feedback/useNotify'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { useMonthlySummary } from '@/features/reports/hooks/useReports'
import { reportApi } from '@/features/reports/api/report.api'
import type { MonthlySummaryItem, ReportFilter } from '@/features/reports/report.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function MonthlySummaryTab() {
  const [filter, setFilter] = useState<ReportFilter>({})
  const { data, isLoading } = useMonthlySummary(filter)
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const summary = data?.summary

  const handleExport = async () => {
    setExporting(true)
    try {
      const name = await reportApi.exportMonthlySummaryExcel(filter)
      notify.success(`Đã xuất báo cáo ${name}`)
    } catch {
      notify.error('Không thể xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  const chartOption = useMemo(() => {
    const months = items.map((i) => i.month)
    const periodic = items.map((i) => i.periodicCount)
    const adHoc = items.map((i) => i.adHocCount)
    const compliance = items.map((i) => i.complianceRate)

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['Phiếu định kỳ', 'Phiếu đột xuất', '% Tuân thủ'] },
      grid: { left: 40, right: 40, top: 40, bottom: 25 },
      xAxis: { type: 'category', data: months },
      yAxis: [
        { type: 'value', name: 'Số phiếu', minInterval: 1 },
        { type: 'value', name: '% Tuân thủ', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      ],
      series: [
        { name: 'Phiếu định kỳ', type: 'bar', stack: 'phiếu', data: periodic, color: '#1677ff' },
        { name: 'Phiếu đột xuất', type: 'bar', stack: 'phiếu', data: adHoc, color: '#fa8c16' },
        { name: '% Tuân thủ', type: 'line', yAxisIndex: 1, data: compliance, color: '#52c41a', symbolSize: 8 },
      ],
    }
  }, [items])

  const columns: ColumnsType<MonthlySummaryItem> = [
    { title: 'Tháng', dataIndex: 'month', key: 'month', width: 100, fixed: 'left' },
    { title: 'Tổng phiếu', dataIndex: 'totalInspections', key: 'totalInspections', align: 'right' },
    { title: 'Định kỳ', dataIndex: 'periodicCount', key: 'periodicCount', align: 'right' },
    { title: 'Đột xuất', dataIndex: 'adHocCount', key: 'adHocCount', align: 'right' },
    { title: 'Hoàn thành', dataIndex: 'completedCount', key: 'completedCount', align: 'right' },
    {
      title: '% Tuân thủ',
      dataIndex: 'complianceRate',
      key: 'complianceRate',
      align: 'right',
      render: (v: number) => <b style={{ color: v >= 85 ? '#52c41a' : v >= 70 ? '#fa8c16' : '#ff4d4f' }}>{v}%</b>,
    },
    { title: 'Tổng lỗi', dataIndex: 'totalFindings', key: 'totalFindings', align: 'right' },
    { title: 'Lỗi M1', dataIndex: 'm1Count', key: 'm1Count', align: 'right' },
    { title: 'Lỗi M2', dataIndex: 'm2Count', key: 'm2Count', align: 'right' },
    { title: 'Lỗi M3', dataIndex: 'm3Count', key: 'm3Count', align: 'right' },
    {
      title: 'Lỗi M4',
      dataIndex: 'm4Count',
      key: 'm4Count',
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: '#ff4d4f' }}>{v}</b> : 0),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <ReportFilterBar filter={filter} onChange={setFilter} />
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

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Tổng số phiếu"
            value={summary?.totalInspections ?? 0}
            icon={<AuditOutlined />}
            tone="blue"
            loading={isLoading}
            footnote={`Hoàn thành: ${summary?.completedCount ?? 0} phiếu`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Tỷ lệ tuân thủ trung bình"
            value={summary?.complianceRate != null ? `${summary.complianceRate}%` : '—'}
            icon={<CheckCircleOutlined />}
            tone={summary && summary.complianceRate >= 85 ? 'good' : 'warning'}
            loading={isLoading}
            footnote="Mục tiêu toàn hệ thống: ≥ 85%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Tổng lỗi vi phạm"
            value={summary?.totalFindings ?? 0}
            icon={<WarningOutlined />}
            tone="warning"
            loading={isLoading}
            footnote={`M1: ${summary?.m1Count ?? 0} · M2: ${summary?.m2Count ?? 0}`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Lỗi nghiêm trọng (M3 & M4)"
            value={(summary?.m3Count ?? 0) + (summary?.m4Count ?? 0)}
            icon={<WarningOutlined />}
            tone={(summary?.m4Count ?? 0) > 0 ? 'critical' : 'neutral'}
            loading={isLoading}
            footnote={`M3: ${summary?.m3Count ?? 0} · M4: ${summary?.m4Count ?? 0}`}
          />
        </Col>
      </Row>

      {items.length > 0 && (
        <Card size="small" title="Biểu đồ xu hướng phiếu kiểm tra và tỷ lệ tuân thủ theo tháng">
          <EChart option={chartOption} height={280} ariaLabel="Biểu đồ tổng hợp tháng" />
        </Card>
      )}

      <TableCard>
        <Flex justify="space-between" align="center" style={{ borderBottom: '1px solid #eef2f6' }}>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>
            Bảng chi tiết tổng hợp theo tháng
          </Typography.Title>
        </Flex>
        <Table
          rowKey="month"
          dataSource={items}
          columns={columns}
          loading={isLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
          summary={() =>
            summary ? (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: 'var(--app-surface-sunken)', fontWeight: 600 }}>
                  <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">{summary.totalInspections}</Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">{summary.periodicCount}</Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">{summary.adHocCount}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">{summary.completedCount}</Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <b style={{ color: summary.complianceRate >= 85 ? '#52c41a' : '#fa8c16' }}>
                      {summary.complianceRate}%
                    </b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">{summary.totalFindings}</Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">{summary.m1Count}</Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">{summary.m2Count}</Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="right">{summary.m3Count}</Table.Summary.Cell>
                  <Table.Summary.Cell index={10} align="right">
                    <b style={{ color: summary.m4Count > 0 ? '#ff4d4f' : undefined }}>{summary.m4Count}</b>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </TableCard>
    </Flex>
  )
}
