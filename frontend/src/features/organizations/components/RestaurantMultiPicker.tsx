import { Select, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants/app.constants'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import type { AssignedRestaurant, OrgUnit } from '@/features/organizations/organizations.types'
import { useDebounce } from '@/hooks/useDebounce'

const PICKER_PAGE_SIZE = 20

/** Người đang phụ trách nhà hàng theo vai trò của ô chọn. */
export type AssigneeSlot = 'storeManager' | 'obm'

interface RestaurantPick {
  label: string
  /** Tên người khác đang phụ trách (sẽ bị thay nếu lưu). */
  takenBy: string | null
}

export interface RestaurantMultiPickerProps {
  value: number[]
  onChange: (ids: number[]) => void
  slot: AssigneeSlot
  /** Người dùng đang sửa: không coi là "người khác" khi nhà hàng đã thuộc họ. */
  selfUserId?: number
  /** Nhà hàng đang gán sẵn, để hiện tên khi chưa nằm trong trang kết quả tìm kiếm. */
  current?: readonly AssignedRestaurant[]
  placeholder?: string
}

function toPick(u: OrgUnit, slot: AssigneeSlot, selfUserId?: number): RestaurantPick {
  const holder = u[slot]
  return {
    label: `${u.name} (${u.code})`,
    takenBy: holder && holder.id !== selfUserId ? holder.fullName : null,
  }
}

/** Chọn nhiều nhà hàng đang hoạt động, tìm trên server; ghi nhớ nhãn của nhà hàng đã chọn. */
export function RestaurantMultiPicker({ value, onChange, slot, selfUserId, current, placeholder }: RestaurantMultiPickerProps) {
  const [keyword, setKeyword] = useState('')
  const debounced = useDebounce(keyword, SEARCH_DEBOUNCE_MS)
  const units = useOrgUnits({
    page: 0,
    size: PICKER_PAGE_SIZE,
    keyword: debounced || undefined,
    unitType: 'RESTAURANT',
    active: true,
  })
  // Bộ nhớ nhãn: nhà hàng đã chọn vẫn hiện đúng tên sau khi đổi từ khoá tìm kiếm.
  // Cập nhật ngay trong lúc render khi nguồn dữ liệu đổi (mẫu "điều chỉnh state theo props" của React).
  const [known, setKnown] = useState(() => ({
    data: undefined as unknown,
    current: undefined as unknown,
    map: new Map<number, RestaurantPick>(),
  }))
  if (known.data !== units.data || known.current !== current) {
    const map = new Map(known.map)
    current?.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, { label: `${r.name} (${r.code})`, takenBy: null })
    })
    units.data?.items.forEach((u) => map.set(u.id, toPick(u, slot, selfUserId)))
    setKnown({ data: units.data, current, map })
  }

  const options = useMemo(() => {
    const ids = new Set<number>([...value, ...(units.data?.items.map((u) => u.id) ?? [])])
    return [...ids].map((id) => {
      const pick = known.map.get(id)
      const label = pick ? (pick.takenBy ? `${pick.label} · đang thuộc ${pick.takenBy}` : pick.label) : `#${id}`
      return { value: id, label }
    })
  }, [value, units.data, known.map])

  const takenOver = value.map((id) => known.map.get(id)).filter((p): p is RestaurantPick => Boolean(p?.takenBy))

  return (
    <>
    <Select<number[]>
      mode="multiple"
      showSearch={{ filterOption: false, onSearch: setKeyword }}
      allowClear
      placeholder={placeholder ?? 'Chọn nhà hàng'}
      loading={units.isFetching}
      options={options}
      value={value}
      onChange={(ids) => onChange(ids)}
      onOpenChange={(open) => {
        if (!open) setKeyword('')
      }}
      notFoundContent={units.isFetching ? 'Đang tìm…' : 'Không có nhà hàng phù hợp'}
    />
    {takenOver.length > 0 && (
      <Typography.Text type="warning" style={{ display: 'block', marginTop: 4, fontSize: 12.5 }}>
        Khi lưu sẽ thay người đang phụ trách: {takenOver.map((p) => `${p.label} (${p.takenBy})`).join(', ')}
      </Typography.Text>
    )}
    </>
  )
}
