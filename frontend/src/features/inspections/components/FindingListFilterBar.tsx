import { Select } from 'antd'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import type { FindingStatus } from '../inspection.types'
import type { OrgUnit } from '@/features/organizations/organizations.types'

export interface FindingListFilterBarProps {
  keyword?: string
  restaurantId?: number
  status?: FindingStatus
  activeFilterCount: number
  restaurants: OrgUnit[]
  onSearch: (kw: string) => void
  onFilterStatus: (val?: FindingStatus) => void
  onFilterRestaurant: (val?: number) => void
  onReset: () => void
}

const DETAIL_STATUS_OPTIONS: { value: FindingStatus; label: string }[] = [
  { value: 'OPEN', label: 'Chờ phản hồi' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'APPEALED', label: 'Đang khiếu nại' },
  { value: 'APPEAL_MEETING', label: 'Họp khiếu nại' },
  { value: 'REMEDIATING', label: 'Đang khắc phục' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ thẩm tra' },
  { value: 'CLOSED', label: 'Đã đóng (Đạt yêu cầu)' },
  { value: 'DISMISSED', label: 'Đã huỷ bỏ' },
]

export function FindingListFilterBar({
  keyword,
  restaurantId,
  status,
  activeFilterCount,
  restaurants,
  onSearch,
  onFilterStatus,
  onFilterRestaurant,
  onReset,
}: FindingListFilterBarProps) {
  return (
    <AdvancedFilter
      search={{
        placeholder: 'Tìm kiếm mô tả vi phạm, khiếu nại, biện pháp khắc phục...',
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
        style={{ width: 240 }}
        filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        options={restaurants.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
      />

      <Select
        placeholder="Trạng thái chi tiết"
        allowClear
        value={status}
        onChange={onFilterStatus}
        style={{ width: 190 }}
        options={DETAIL_STATUS_OPTIONS}
      />
    </AdvancedFilter>
  )
}
