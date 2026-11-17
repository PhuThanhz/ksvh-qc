import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Flex, Row, Select, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { KpiCard } from '@/components/data-display/KpiCard'
import { TableCard } from '@/components/data-display/TableCard'
import { OccurrenceHistoryModal } from '@/features/inspections/components/risk-profile/OccurrenceHistoryModal'
import { useRestaurantRiskProfile } from '@/features/inspections/hooks/useRiskProfile'
import type { CriterionRiskProfileItem } from '@/features/inspections/risk-profile.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { formatDate } from '@/utils/format-date'

export interface RestaurantRiskProfileTabProps {
  initialRestaurantId?: number
}

export function RestaurantRiskProfileTab({ initialRestaurantId }: RestaurantRiskProfileTabProps) {
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const restList = restaurants.data?.items ?? []

  const [restaurantId, setRestaurantId] = useState<number | undefined>(
    initialRestaurantId ?? restList[0]?.id
  )
  const [asOfDate, setAsOfDate] = useState<string | undefined>(undefined)
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionRiskProfileItem | undefined>(undefined)

  const activeRestId = restaurantId ?? restList[0]?.id
  const { data, isLoading } = useRestaurantRiskProfile(activeRestId, asOfDate)

  const columns: ColumnsType<CriterionRiskProfileItem> = [
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
      title: 'Mức ảnh hưởng',
      key: 'impact',
      width: 160,
      render: (_, r) => (
        <Flex align="center" gap={6}>
          <Tag>Gốc: Mức {r.baseImpact}</Tag>
          {r.isEscalated ? (
            <Tag color="error">▲ Hiệu lực: Mức {r.effectiveImpact}</Tag>
          ) : (
            <Tag color="success">Hiệu lực: Mức {r.effectiveImpact}</Tag>
          )}
        </Flex>
      ),
    },
    {
      title: 'Tần suất kỳ',
      dataIndex: 'frequencyInPeriod',
      key: 'frequencyInPeriod',
      width: 105,
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: v >= 3 ? '#ff4d4f' : '#fa8c16' }}>{v} lần</b> : '0'),
    },
    {
      title: 'Lần lỗi gần nhất',
      dataIndex: 'lastViolationDate',
      key: 'lastViolationDate',
      width: 130,
      render: (v?: string) => (v ? formatDate(v) : 'Chưa có lỗi'),
    },
    {
      title: 'Dự kiến hạ mức',
      key: 'reset',
      width: 210,
      render: (_, r) => {
        if (!r.isEscalated) {
          return <Tag color="default">Đang ở mức gốc</Tag>
        }
        return (
          <Tooltip title={`Đã có ${r.cleanMonthsCount}/${data?.resetPeriodMonths ?? 6} tháng sạch liên tục`}>
            <Tag color="warning">
              Về mức {r.baseImpact} từ {formatDate(r.expectedResetDate)}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Lỗi đang mở',
      dataIndex: 'openFindingsCount',
      key: 'openFindingsCount',
      width: 110,
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: '#ff4d4f' }}>{v}</b> : 0),
    },
    {
      title: 'Lịch sử',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Tooltip title="Xem lịch sử các lần vi phạm">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setSelectedCriterion(r)}
            disabled={!r.occurrences?.length}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Card size="small">
        <Flex wrap="wrap" gap={12} align="center" justify="space-between">
          <Flex wrap="wrap" gap={10} align="center">
            <span style={{ fontWeight: 500 }}>Nhà hàng:</span>
            <Select
              placeholder="Chọn nhà hàng xem hồ sơ"
              showSearch
              value={activeRestId}
              onChange={(id) => setRestaurantId(id)}
              style={{ width: 280 }}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={restList.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
            />

            <span style={{ fontWeight: 500, marginLeft: 8 }}>Tính đến ngày:</span>
            <DatePicker
              value={asOfDate ? dayjs(asOfDate) : null}
              placeholder="Hôm nay"
              format="DD/MM/YYYY"
              onChange={(d) => setAsOfDate(d ? d.format('YYYY-MM-DD') : undefined)}
              style={{ width: 140 }}
            />
          </Flex>

          {data && (
            <div style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
              Công ty: <b>{data.companyName || '—'}</b> · CHT: <b>{data.storeManagerName || '—'}</b>
            </div>
          )}
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Tiêu chí đang bị nâng mức"
            value={data?.totalEscalatedCriteria ?? 0}
            icon={<FireOutlined />}
            tone={(data?.totalEscalatedCriteria ?? 0) > 0 ? 'critical' : 'neutral'}
            loading={isLoading}
            footnote="Cần theo dõi sát để hạ mức"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Lỗi đang xử lý / mở"
            value={data?.totalActiveFindings ?? 0}
            icon={<AlertOutlined />}
            tone={(data?.totalActiveFindings ?? 0) > 0 ? 'warning' : 'good'}
            loading={isLoading}
            footnote="Bao gồm chờ phản hồi, khắc phục"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Kỳ đếm tần suất"
            value={data?.periodMonths != null ? `${data.periodMonths} tháng` : '—'}
            icon={<CalendarOutlined />}
            tone="blue"
            loading={isLoading}
            footnote={data?.periodStart ? `Bắt đầu từ ${formatDate(data.periodStart)}` : undefined}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            label="Điều kiện hạ mức"
            value={data?.resetPeriodMonths != null ? `${data.resetPeriodMonths} tháng` : '—'}
            icon={<CheckCircleOutlined />}
            tone="good"
            loading={isLoading}
            footnote="Liên tục không phát sinh lỗi"
          />
        </Col>
      </Row>

      <TableCard>
        <Flex justify="space-between" align="center" style={{ margin: '8px 0 12px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Hồ sơ rủi ro chi tiết theo từng tiêu chí tại {data?.restaurantName || 'nhà hàng'}
          </Typography.Title>
          <span style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
            Tổng số: <b>{data?.criteria.length ?? 0}</b> tiêu chí từng ghi nhận vi phạm
          </span>
        </Flex>

        <Table
          rowKey="criterionId"
          dataSource={data?.criteria ?? []}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 950 }}
        />
      </TableCard>

      <OccurrenceHistoryModal
        open={!!selectedCriterion}
        criterion={selectedCriterion}
        onClose={() => setSelectedCriterion(undefined)}
      />
    </Flex>
  )
}
