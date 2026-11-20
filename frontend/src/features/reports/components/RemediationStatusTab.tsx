import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import { Button, Col, Flex, Progress, Row, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { KpiCard } from '@/components/data-display/KpiCard'
import { TableCard } from '@/components/data-display/TableCard'
import { useNotify } from '@/components/feedback/useNotify'
import { RemediationCharts } from '@/features/reports/components/ReportCharts'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { useRemediations } from '@/features/reports/hooks/useReports'
import { reportApi } from '@/features/reports/api/report.api'
import type { RemediationStatusItem, ReportFilter } from '@/features/reports/report.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

export function RemediationStatusTab() {
  const [filter, setFilter] = useState<ReportFilter>({})
  const { data, isLoading } = useRemediations(filter)
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)

  const items = data?.items ?? []
  const summary = data?.summary

  const handleExport = async () => {
    setExporting(true)
    try {
      const name = await reportApi.exportRemediationsExcel(filter)
      notify.success(`Đã xuất báo cáo ${name}`)
    } catch {
      notify.error('Không thể xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  const columns: ColumnsType<RemediationStatusItem> = [
    {
      title: 'Nhà hàng',
      key: 'restaurant',
      width: 220,
      render: (_, r) => (
        <div>
          <b>{r.restaurantName}</b>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>
            Mã: {r.restaurantCode} · CHT: {r.storeManagerName || '—'}
          </div>
        </div>
      ),
    },
    { title: 'Công ty', dataIndex: 'companyName', key: 'companyName', width: 140 },
    { title: 'Tổng lỗi', dataIndex: 'totalFindings', key: 'totalFindings', align: 'right', width: 90 },
    {
      title: 'Đúng hạn',
      dataIndex: 'resolvedOnTimeCount',
      key: 'resolvedOnTimeCount',
      align: 'right',
      width: 95,
      render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Trễ hạn (đã đóng)',
      dataIndex: 'resolvedOverdueCount',
      key: 'resolvedOverdueCount',
      align: 'right',
      width: 130,
      render: (v: number) => (v > 0 ? <span style={{ color: '#fa8c16' }}>{v}</span> : 0),
    },
    {
      title: 'Quá hạn (chưa xử lý)',
      dataIndex: 'overdueOpenCount',
      key: 'overdueOpenCount',
      align: 'right',
      width: 140,
      render: (v: number) => (v > 0 ? <b style={{ color: '#ff4d4f' }}>{v}</b> : 0),
    },
    {
      title: 'Đang xử lý (trong hạn)',
      dataIndex: 'inProgressCount',
      key: 'inProgressCount',
      align: 'right',
      width: 145,
    },
    {
      title: 'Tỷ lệ đúng hạn',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      width: 160,
      render: (v: number) => (
        <Progress
          percent={Number(v.toFixed(1))}
          size="small"
          status={v >= 85 ? 'success' : v >= 70 ? 'normal' : 'exception'}
        />
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <ReportFilterBar
        filter={filter}
        onChange={setFilter}
        extra={
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
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Tổng số lỗi phát hiện"
            value={summary?.totalFindings ?? 0}
            icon={<ExclamationCircleOutlined />}
            tone="blue"
            loading={isLoading}
            footnote="Lỗi cần khắc phục & nghiệm thu"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Đã khắc phục đúng hạn"
            value={summary?.resolvedOnTimeCount ?? 0}
            icon={<CheckCircleOutlined />}
            tone="good"
            loading={isLoading}
            footnote={`Hoàn thành trong thời hạn yêu cầu`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Lỗi quá hạn (đang mở)"
            value={summary?.overdueOpenCount ?? 0}
            icon={<ClockCircleOutlined />}
            tone={(summary?.overdueOpenCount ?? 0) > 0 ? 'critical' : 'neutral'}
            loading={isLoading}
            footnote="Cần đôn đốc nhà hàng xử lý gấp"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Tỷ lệ khắc phục đúng hạn"
            value={summary?.onTimeRate != null ? `${summary.onTimeRate.toFixed(1)}%` : '—'}
            icon={<CheckCircleOutlined />}
            tone={summary && summary.onTimeRate >= 85 ? 'good' : 'warning'}
            loading={isLoading}
            footnote="Mục tiêu toàn hệ thống: ≥ 85%"
          />
        </Col>
      </Row>

      <RemediationCharts items={items} summary={summary} loading={isLoading} />

      <TableCard>
        <Flex justify="space-between" align="center" style={{ borderBottom: '1px solid #eef2f6' }}>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>
            Tình trạng & Tiến độ khắc phục vi phạm theo nhà hàng
          </Typography.Title>
        </Flex>
        <Table
          rowKey="restaurantId"
          dataSource={items}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 1050 }}
        />
      </TableCard>
    </Flex>
  )
}
