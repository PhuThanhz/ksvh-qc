import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { Col, DatePicker, Flex, Row, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { KpiCard } from '@/components/data-display/KpiCard'
import { TableCard } from '@/components/data-display/TableCard'
import { CriterionRiskTable } from '@/features/inspections/components/risk-profile/CriterionRiskTable'
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

  return (
    <Flex vertical gap={16}>
      <div className="advanced-filter">
        <Flex wrap="wrap" gap={10} align="center" justify="space-between">
          <Flex wrap="wrap" gap={8} align="center">
            <Select
              placeholder="Chọn cơ sở xem hồ sơ rủi ro"
              showSearch
              value={activeRestId}
              onChange={(id) => setRestaurantId(id)}
              style={{ width: 290 }}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={restList.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
            />

            <DatePicker
              value={asOfDate ? dayjs(asOfDate) : null}
              placeholder="Tính đến hôm nay"
              format="DD/MM/YYYY"
              onChange={(d) => setAsOfDate(d ? d.format('YYYY-MM-DD') : undefined)}
              style={{ width: 165 }}
            />
          </Flex>

          {data && (
            <Flex wrap gap={8} align="center">
              <span className="app-stat-chip">
                Công ty: <strong>{data.companyName || '—'}</strong>
              </span>
              <span className="app-stat-chip">
                Cửa hàng trưởng: <strong>{data.storeManagerName || '—'}</strong>
              </span>
            </Flex>
          )}
        </Flex>
      </div>

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
            footnote={
              data
                ? `${data.customEscalation ? 'Ngưỡng riêng' : 'Quy tắc chung'}${
                    data.escalationThreshold != null ? ` · nâng mức từ ${data.escalationThreshold} lần` : ''
                  }${data.stepIncrease != null ? ` · +${data.stepIncrease} bậc` : ''}`
                : 'Liên tục không phát sinh lỗi'
            }
          />
        </Col>
      </Row>

      <TableCard>
        <Flex justify="space-between" align="center" style={{ borderBottom: '1px solid #eef2f6' }}>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>
            Hồ sơ rủi ro chi tiết theo từng tiêu chí tại {data?.restaurantName || 'nhà hàng'}
          </Typography.Title>
          <span className="app-secondary-text">
            Tổng số: <b>{data?.criteria.length ?? 0}</b> tiêu chí từng ghi nhận vi phạm
          </span>
        </Flex>

        <CriterionRiskTable
          criteria={data?.criteria ?? []}
          isLoading={isLoading}
          resetPeriodMonths={data?.resetPeriodMonths}
          onSelectCriterion={setSelectedCriterion}
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
