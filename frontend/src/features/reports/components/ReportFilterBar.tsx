import { ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select } from 'antd'
import dayjs from 'dayjs'
import { useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useCompanies, useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import type { ReportFilter } from '@/features/reports/report.types'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ROLES } from '@/permissions'

export interface ReportFilterBarProps {
  filter: ReportFilter
  onChange: (filter: ReportFilter) => void
  showGroup?: boolean
  showInspector?: boolean
  showRestaurant?: boolean
}

export function ReportFilterBar({
  filter,
  onChange,
  showGroup = false,
  showInspector = true,
  showRestaurant = true,
}: ReportFilterBarProps) {
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const restaurants = useOrgUnits({
    unitType: 'RESTAURANT',
    companyId: filter.companyId,
    page: 0,
    size: 200,
    active: true,
  })
  const inspectors = useUsers({ page: 0, size: 200, active: true, role: ROLES.KSVH_INSPECTOR })
  const groups = useCriterionGroups(filter.companyId)

  const dateValue: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [
    filter.from ? dayjs(filter.from) : null,
    filter.to ? dayjs(filter.to) : null,
  ]

  const handleReset = () => {
    onChange({})
  }

  const hasActiveFilters = Boolean(
    filter.from || filter.to || filter.companyId || filter.restaurantId || filter.inspectorId || filter.groupId,
  )

  return (
    <div className="advanced-filter">
      <Flex wrap="wrap" gap={8} align="center">
        <DatePicker.RangePicker
          value={dateValue}
          placeholder={['Từ ngày', 'Đến ngày']}
          format="DD/MM/YYYY"
          onChange={(dates) => {
            onChange({
              ...filter,
              from: dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
              to: dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
            })
          }}
          style={{ width: 240 }}
        />

        <Select
          placeholder="Công ty"
          allowClear
          showSearch
          value={filter.companyId}
          onChange={(companyId) => onChange({ ...filter, companyId, restaurantId: undefined, groupId: undefined })}
          style={{ width: 170 }}
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={companies.data?.items.map((c) => ({ value: c.id, label: c.name }))}
        />

        {showRestaurant && (
          <Select
            placeholder="Nhà hàng"
            allowClear
            showSearch
            value={filter.restaurantId}
            onChange={(restaurantId) => onChange({ ...filter, restaurantId })}
            style={{ width: 190 }}
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={restaurants.data?.items.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
          />
        )}

        {showInspector && (
          <Select
            placeholder="Chuyên viên KSVH"
            allowClear
            showSearch
            value={filter.inspectorId}
            onChange={(inspectorId) => onChange({ ...filter, inspectorId })}
            style={{ width: 180 }}
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={inspectors.data?.items.map((u) => ({ value: u.id, label: u.fullName || u.username }))}
          />
        )}

        {showGroup && (
          <Select
            placeholder="Nhóm tiêu chí"
            allowClear
            showSearch
            value={filter.groupId}
            onChange={(groupId) => onChange({ ...filter, groupId })}
            style={{ width: 180 }}
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={groups.data?.map((g) => ({ value: g.id, label: g.name }))}
          />
        )}

        {hasActiveFilters && (
          <Button className="filter-reset" icon={<ReloadOutlined />} onClick={handleReset}>
            Đặt lại
          </Button>
        )}
      </Flex>
    </div>
  )
}
