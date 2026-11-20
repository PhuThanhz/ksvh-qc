import { DatePicker, Select } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
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
  /** Nút phụ bên phải cùng hàng nút Bộ lọc (vd Xuất Excel). */
  extra?: ReactNode
}

export function ReportFilterBar({
  filter,
  onChange,
  showGroup = false,
  showInspector = true,
  showRestaurant = true,
  extra,
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

  const activeCount = [filter.from || filter.to, filter.companyId, filter.restaurantId, filter.inspectorId, filter.groupId].filter(Boolean).length

  // Thu gọn như các trang danh sách: bấm "Bộ lọc" mới bung các ô điều kiện, nút phụ (Xuất Excel) nằm cùng hàng bên phải.
  return (
    <AdvancedFilter activeCount={activeCount} onReset={() => onChange({})} extra={extra}>
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
        style={{ width: 200 }}
        popupMatchSelectWidth={420}
        filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        options={companies.data?.items.map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))}
        optionRender={(o) => <span className="report-filter__option" title={String(o.label)}>{o.label}</span>}
      />

      {showRestaurant && (
        <Select
          placeholder="Nhà hàng"
          allowClear
          showSearch
          value={filter.restaurantId}
          onChange={(restaurantId) => onChange({ ...filter, restaurantId })}
          style={{ width: 200 }}
          popupMatchSelectWidth={420}
          optionRender={(o) => <span className="report-filter__option" title={String(o.label)}>{o.label}</span>}
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
          popupMatchSelectWidth={320}
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
          style={{ width: 200 }}
          popupMatchSelectWidth={380}
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={groups.data?.map((g) => ({ value: g.id, label: g.name }))}
          optionRender={(o) => <span className="report-filter__option" title={String(o.label)}>{o.label}</span>}
        />
      )}

    </AdvancedFilter>
  )
}
