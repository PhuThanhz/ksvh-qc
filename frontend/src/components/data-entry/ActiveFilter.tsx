import { useMemo } from 'react'
import { FilterSelect } from '@/components/data-entry/FilterSelect'

type ActiveKey = 'active' | 'inactive'

export interface ActiveFilterProps {
  value: boolean | undefined
  onChange: (active: boolean | undefined) => void
  placeholder?: string
  width?: number
  activeLabel?: string
  inactiveLabel?: string
}

/** Lọc theo trạng thái hoạt động dùng chung (Active / Inactive). */
export function ActiveFilter({
  value,
  onChange,
  placeholder = 'Trạng thái',
  width,
  activeLabel = 'Đang hoạt động',
  inactiveLabel = 'Ngưng hoạt động',
}: ActiveFilterProps) {
  const key: ActiveKey | undefined = value === undefined ? undefined : value ? 'active' : 'inactive'

  const options = useMemo<{ value: ActiveKey; label: string }[]>(
    () => [
      { value: 'active', label: activeLabel },
      { value: 'inactive', label: inactiveLabel },
    ],
    [activeLabel, inactiveLabel],
  )

  return (
    <FilterSelect<ActiveKey>
      placeholder={placeholder}
      value={key}
      options={options}
      width={width}
      onChange={(v) => onChange(v === undefined ? undefined : v === 'active')}
    />
  )
}
