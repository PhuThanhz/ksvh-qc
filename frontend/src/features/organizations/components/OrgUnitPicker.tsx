import { Select } from 'antd'
import { useMemo, useState, type CSSProperties } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants/app.constants'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { ORG_UNIT_TYPE_LABEL } from '@/features/organizations/organizations.types'
import { useDebounce } from '@/hooks/useDebounce'

const PICKER_PAGE_SIZE = 20

export interface OrgUnitPickerProps {
  value: number | null | undefined
  onChange: (id: number | null) => void
  /** Đơn vị đang chọn, để hiện tên khi chưa nằm trong trang kết quả tìm kiếm. */
  current?: { id: number; name: string } | null
  placeholder?: string
  /** Mặc định chỉ hiện đơn vị đang hoạt động. */
  includeInactive?: boolean
  style?: CSSProperties
}

/** Chọn nhà hàng / phòng ban, tìm trên server. */
export function OrgUnitPicker({ value, onChange, current, placeholder, includeInactive, style }: OrgUnitPickerProps) {
  const [keyword, setKeyword] = useState('')
  const debounced = useDebounce(keyword, SEARCH_DEBOUNCE_MS)
  const units = useOrgUnits({
    page: 0,
    size: PICKER_PAGE_SIZE,
    keyword: debounced || undefined,
    active: includeInactive ? undefined : true,
  })

  const options = useMemo(() => {
    const list = (units.data?.items ?? []).map((u) => ({
      value: u.id,
      label: `${u.name} (${u.code}) · ${ORG_UNIT_TYPE_LABEL[u.unitType]}`,
    }))
    if (current && !list.some((o) => o.value === current.id)) list.unshift({ value: current.id, label: current.name })
    return list
  }, [units.data, current])

  return (
    <Select<number>
      showSearch={{ filterOption: false, onSearch: setKeyword }}
      allowClear
      style={style}
      placeholder={placeholder ?? 'Chọn nhà hàng / phòng ban'}
      loading={units.isFetching}
      options={options}
      value={value ?? undefined}
      onChange={(v) => onChange(v ?? null)}
      onOpenChange={(open) => {
        if (!open) setKeyword('')
      }}
      notFoundContent={units.isFetching ? 'Đang tìm…' : 'Không có đơn vị phù hợp'}
    />
  )
}
