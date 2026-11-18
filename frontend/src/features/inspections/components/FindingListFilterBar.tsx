import { Segmented, Select } from 'antd'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import type { FindingStatus } from '../inspection.types'
import type { OrgUnit } from '@/features/organizations/organizations.types'

export interface FindingListFilterBarProps {
  activeTab: string
  pendingCount?: number
  keyword?: string
  restaurantId?: number
  status?: FindingStatus
  activeFilterCount: number
  restaurants: OrgUnit[]
  onSearch: (kw: string) => void
  onFilterTab: (val: string) => void
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
  { value: 'PENDING_VERIFICATION', label: 'Chờ nghiệm thu' },
  { value: 'CLOSED', label: 'Đã đóng (Đạt)' },
  { value: 'DISMISSED', label: 'Đã huỷ bỏ' },
]

export function FindingListFilterBar({
  activeTab,
  pendingCount,
  keyword,
  restaurantId,
  status,
  activeFilterCount,
  restaurants,
  onSearch,
  onFilterTab,
  onFilterStatus,
  onFilterRestaurant,
  onReset,
}: FindingListFilterBarProps) {
  const statusTabs = [
    { value: 'ALL', label: 'Tất cả' },
    {
      value: 'PENDING_REVIEW',
      label: pendingCount ? `Chờ tôi thẩm định (${pendingCount})` : 'Chờ tôi thẩm định',
    },
    { value: 'OPEN', label: 'Chờ phản hồi' },
    { value: 'APPEALED', label: 'Đang khiếu nại' },
    { value: 'APPEAL_MEETING', label: 'Họp khiếu nại' },
    { value: 'REMEDIATING', label: 'Đang khắc phục' },
    { value: 'PENDING_VERIFICATION', label: 'Chờ nghiệm thu' },
    { value: 'CLOSED', label: 'Đã đóng' },
  ]

  return (
    <AdvancedFilter
      top={
        <Segmented
          options={statusTabs}
          value={activeTab}
          onChange={(val) => onFilterTab(val as string)}
          style={{ width: 'fit-content', background: 'var(--app-surface-sunken)', padding: 3, borderRadius: 8 }}
        />
      }
      search={{
        placeholder: 'Tìm kiếm mô tả lỗi, khiếu nại, khắc phục...',
        maxWidth: 460,
        value: keyword,
        onSearch,
      }}
      activeCount={activeFilterCount}
      onReset={onReset}
    >
      <Select
        placeholder="Nhà hàng"
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
