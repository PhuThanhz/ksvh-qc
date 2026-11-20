import { Button, Flex, Select } from 'antd'
import type { OrgUnit } from '@/features/organizations/organizations.types'

export interface PlanAddRestaurantsProps {
  restaurants: readonly OrgUnit[]
  /** Nhà hàng đang có trong kế hoạch: hiện dấu ✓ trong danh sách, bỏ tick = gỡ khỏi kế hoạch. */
  takenIds: ReadonlySet<number>
  onAdd: (restaurantIds: number[]) => void
  onRemove: (restaurantIds: number[]) => void
}

/**
 * Ô chọn nhà hàng (bước đầu tiên): tick nhiều nhà hàng cùng lúc, dropdown giữ mở để chọn tiếp,
 * nhà hàng đã chọn có dấu ✓, ô hiển thị "Đã chọn N nhà hàng". Kèm nút thêm tất cả nhà hàng còn lại.
 */
export function PlanAddRestaurants({ restaurants, takenIds, onAdd, onRemove }: PlanAddRestaurantsProps) {
  const remaining = restaurants.filter((r) => !takenIds.has(r.id))

  return (
    <Flex vertical gap={6} style={{ flex: 1, minWidth: 0 }}>
      <Flex gap={8}>
        <Select<number[]>
          mode="multiple"
          value={[...takenIds]}
          showSearch={{ optionFilterProp: 'label', autoClearSearchValue: false }}
          placeholder={<span className="plan-add__placeholder">Tick một hoặc nhiều nhà hàng – gõ mã hoặc tên để tìm</span>}
          maxTagCount={0}
          maxTagPlaceholder={() => <span className="plan-add__count">Đã chọn {takenIds.size} nhà hàng</span>}
          onSelect={(id: number) => onAdd([id])}
          onDeselect={(id: number) => onRemove([id])}
          options={restaurants.map((r) => ({ value: r.id, label: `${r.code} – ${r.name}` }))}
          notFoundContent="Không tìm thấy nhà hàng"
          popupMatchSelectWidth={460}
          className="plan-add"
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button disabled={remaining.length === 0} onClick={() => onAdd(remaining.map((r) => r.id))}>
          Thêm tất cả ({remaining.length})
        </Button>
      </Flex>
      <span className="plan-add__hint">
        Nhà hàng vừa thêm được tick sẵn trong bảng – bấm một chuyên viên ở cột trái để giao
      </span>
    </Flex>
  )
}
