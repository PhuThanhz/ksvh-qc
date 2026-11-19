import { Select } from 'antd'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import type { InspectionStatus } from '../inspection.types'
import type { OrgUnit } from '@/features/organizations/organizations.types'

export interface InspectionListFilterBarProps {
  keyword?: string
  restaurantId?: number
  status?: InspectionStatus
  activeFilterCount: number
  restaurants: OrgUnit[]
  onSearch: (kw: string) => void
  onFilterStatus: (val?: InspectionStatus) => void
  onFilterRestaurant: (val?: number) => void
  onReset: () => void
}

const STATUS_SELECT_OPTIONS: { value: InspectionStatus; label: string }[] = [
  { value: 'ASSIGNED', label: 'Đã phân công' },
  { value: 'IN_PROGRESS', label: 'Đang đánh giá' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'AWAITING_ACK', label: 'Chờ xác nhận biên bản' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

export function InspectionListFilterBar({
  keyword,
  restaurantId,
  status,
  activeFilterCount,
  restaurants,
  onSearch,
  onFilterStatus,
  onFilterRestaurant,
  onReset,
}: InspectionListFilterBarProps) {
  return (
    <AdvancedFilter
      search={{
        placeholder: 'Tìm theo mã biên bản, loại kiểm tra...',
        value: keyword,
        onSearch,
      }}
      activeCount={activeFilterCount}
      onReset={onReset}
    >
      <Select
        placeholder="Cơ sở vận hành"
        allowClear
        showSearch
        value={restaurantId}
        onChange={onFilterRestaurant}
        style={{ width: 220 }}
        filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        options={restaurants.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
      />

      <Select
        placeholder="Trạng thái"
        allowClear
        value={status}
        onChange={onFilterStatus}
        style={{ width: 160 }}
        options={STATUS_SELECT_OPTIONS}
      />
    </AdvancedFilter>
  )
}
