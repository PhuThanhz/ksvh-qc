import { FileExcelOutlined, TrophyOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { Link } from 'react-router'
import { TableCard } from '@/components/data-display/TableCard'
import { useNotify } from '@/components/feedback/useNotify'
import { ROUTES } from '@/constants/routes'
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar'
import { useRestaurantRankings } from '@/features/reports/hooks/useReports'
import { reportApi } from '@/features/reports/api/report.api'
import type { ReportFilter, RestaurantRankingItem } from '@/features/reports/report.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

const RANK_TAG: Record<string, { color: string; label: string }> = {
  'Xuất sắc': { color: 'success', label: 'Xuất sắc (≥90%)' },
  'Tốt': { color: 'blue', label: 'Tốt (80-89%)' },
  'Trung bình': { color: 'warning', label: 'Trung bình (70-79%)' },
  'Cần cải thiện': { color: 'error', label: 'Cần cải thiện (<70%)' },
}

export function RestaurantRankingTab() {
  const [filter, setFilter] = useState<ReportFilter>({})
  const { data, isLoading } = useRestaurantRankings(filter)
  const notify = useNotify()
  const [exporting, setExporting] = useState(false)

  const items = data?.items ?? []

  const handleExport = async () => {
    setExporting(true)
    try {
      const name = await reportApi.exportRestaurantRankingsExcel(filter)
      notify.success(`Đã xuất báo cáo ${name}`)
    } catch {
      notify.error('Không thể xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  const columns: ColumnsType<RestaurantRankingItem> = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 70,
      align: 'center',
      render: (_, __, idx) => {
        const rank = idx + 1
        if (rank === 1) return <TrophyOutlined style={{ color: '#faad14', fontSize: 18 }} />
        if (rank === 2) return <TrophyOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
        if (rank === 3) return <TrophyOutlined style={{ color: '#d48806', fontSize: 15 }} />
        return rank
      },
    },
    {
      title: 'Nhà hàng',
      key: 'restaurant',
      width: 220,
      render: (_, r) => (
        <div>
          <Link to={`${ROUTES.admin.riskProfiles}?restaurantId=${r.restaurantId}`} style={{ fontWeight: 600 }}>
            {r.restaurantName}
          </Link>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>
            Mã: {r.restaurantCode} · CHT: {r.storeManagerName || '—'}
          </div>
        </div>
      ),
    },
    { title: 'Công ty', dataIndex: 'companyName', key: 'companyName', width: 140 },
    { title: 'Số phiếu', dataIndex: 'inspectionCount', key: 'inspectionCount', align: 'right', width: 90 },
    {
      title: 'Điểm TB',
      dataIndex: 'averageScore',
      key: 'averageScore',
      align: 'right',
      width: 90,
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '% Tuân thủ',
      dataIndex: 'complianceRate',
      key: 'complianceRate',
      align: 'right',
      width: 105,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: v >= 85 ? '#52c41a' : v >= 70 ? '#fa8c16' : '#ff4d4f' }}>
          {v.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Lỗi đang mở',
      dataIndex: 'openFindingsCount',
      key: 'openFindingsCount',
      align: 'right',
      width: 110,
      render: (v: number) => (v > 0 ? <b style={{ color: '#fa8c16' }}>{v}</b> : 0),
    },
    {
      title: 'Chi tiết lỗi',
      key: 'findingsBreakdown',
      width: 180,
      render: (_, r) => (
        <span style={{ fontSize: 12 }}>
          M1: {r.m1Count} | M2: {r.m2Count} | M3: {r.m3Count} |{' '}
          {r.m4Count > 0 ? <b style={{ color: '#ff4d4f' }}>M4: {r.m4Count}</b> : 'M4: 0'}
        </span>
      ),
    },
    {
      title: 'Xếp hạng',
      dataIndex: 'rankCategory',
      key: 'rankCategory',
      align: 'center',
      width: 140,
      render: (cat: string) => {
        const meta = RANK_TAG[cat] || { color: 'default', label: cat }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <ReportFilterBar filter={filter} onChange={setFilter} />
        <ProtectedAction access={{ anyOf: [PERMISSIONS.REPORT.EXPORT, PERMISSIONS.REPORT.READ] }}>
          <Button
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>
        </ProtectedAction>
      </Flex>

      <TableCard>
        <Flex justify="space-between" align="center" style={{ margin: '8px 0 12px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Bảng xếp hạng mức độ tuân thủ & rủi ro theo nhà hàng
          </Typography.Title>
          <span style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
            Tổng số: <b>{items.length}</b> nhà hàng
          </span>
        </Flex>
        <Table
          rowKey="restaurantId"
          dataSource={items}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </TableCard>
    </Flex>
  )
}
