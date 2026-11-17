import { ArrowRightOutlined, FireOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { TableCard } from '@/components/data-display/TableCard'
import { useEscalatedCriteria } from '@/features/inspections/hooks/useRiskProfile'
import type { EscalatedCriterionSummary } from '@/features/inspections/risk-profile.types'
import { formatDate } from '@/utils/format-date'

export interface SystemEscalatedCriteriaTabProps {
  onSelectRestaurant: (restaurantId: number) => void
}

export function SystemEscalatedCriteriaTab({ onSelectRestaurant }: SystemEscalatedCriteriaTabProps) {
  const [asOfDate, setAsOfDate] = useState<string | undefined>(undefined)
  const { data, isLoading } = useEscalatedCriteria(asOfDate)

  const items = data ?? []

  const columns: ColumnsType<EscalatedCriterionSummary> = [
    {
      title: 'Nhà hàng',
      key: 'restaurant',
      width: 200,
      render: (_, r) => (
        <div>
          <b>{r.restaurantName}</b>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>Mã: {r.restaurantCode}</div>
        </div>
      ),
    },
    {
      title: 'Công ty',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 140,
      render: (v) => v || '—',
    },
    {
      title: 'Tiêu chí bị nâng mức',
      key: 'criterion',
      render: (_, r) => (
        <div>
          <b style={{ color: '#ff4d4f' }}>{r.criterionCode}</b> - {r.criterionName}
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>Nhóm: {r.groupName || 'Chung'}</div>
        </div>
      ),
    },
    {
      title: 'Mức ảnh hưởng',
      key: 'impact',
      width: 170,
      render: (_, r) => (
        <Flex align="center" gap={6}>
          <Tag>Gốc: Mức {r.baseImpact}</Tag>
          <Tag color="error">▲ Nâng lên: Mức {r.effectiveImpact}</Tag>
        </Flex>
      ),
    },
    {
      title: 'Tần suất kỳ',
      dataIndex: 'frequencyInPeriod',
      key: 'frequencyInPeriod',
      width: 100,
      align: 'right',
      render: (v: number) => <b style={{ color: '#ff4d4f' }}>{v} lần</b>,
    },
    {
      title: 'Lần lỗi gần nhất',
      dataIndex: 'lastViolationDate',
      key: 'lastViolationDate',
      width: 130,
      render: (v?: string) => (v ? formatDate(v) : '—'),
    },
    {
      title: 'Dự kiến hạ mức',
      dataIndex: 'expectedResetDate',
      key: 'expectedResetDate',
      width: 170,
      render: (v?: string, r?: EscalatedCriterionSummary) => (
        <Tooltip title={`Đã qua ${r?.cleanMonthsCount ?? 0} tháng sạch liên tục không lỗi`}>
          <Tag color="warning">Về mức gốc từ {formatDate(v)}</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          type="link"
          icon={<ArrowRightOutlined />}
          onClick={() => onSelectRestaurant(r.restaurantId)}
        >
          Hồ sơ
        </Button>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Flex align="center" gap={10}>
          <span style={{ fontWeight: 500 }}>Tính đến ngày:</span>
          <DatePicker
            value={asOfDate ? dayjs(asOfDate) : null}
            placeholder="Hôm nay"
            format="DD/MM/YYYY"
            onChange={(d) => setAsOfDate(d ? d.format('YYYY-MM-DD') : undefined)}
            style={{ width: 140 }}
          />
        </Flex>

        <span style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
          <FireOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
          Toàn hệ thống có <b>{items.length}</b> tiêu chí đang bị nâng mức do tái phạm
        </span>
      </Flex>

      <TableCard>
        <Typography.Title level={5} style={{ margin: '8px 0 12px' }}>
          Danh sách các điểm nóng tiêu chí đang bị nâng mức rủi ro
        </Typography.Title>
        <Table
          rowKey={(r) => `${r.restaurantId}-${r.criterionId}`}
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
