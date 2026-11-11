import { DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

export interface DateRangeValue {
  from?: string
  to?: string
}

export interface FilterDateRangeProps {
  from?: string
  to?: string
  placeholder?: [string, string]
  onChange: (range: DateRangeValue) => void
}

/** Bộ lọc khoảng ngày (YYYY-MM-DD) dùng trong FilterBar. */
export function FilterDateRange({
  from,
  to,
  placeholder = ['Từ ngày', 'Đến ngày'],
  onChange,
}: FilterDateRangeProps) {
  const value: [Dayjs | null, Dayjs | null] | null =
    from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null

  return (
    <DatePicker.RangePicker
      allowClear
      format="DD/MM/YYYY"
      placeholder={placeholder}
      value={value}
      onChange={(dates) =>
        onChange({
          from: dates?.[0]?.format('YYYY-MM-DD'),
          to: dates?.[1]?.format('YYYY-MM-DD'),
        })
      }
    />
  )
}
