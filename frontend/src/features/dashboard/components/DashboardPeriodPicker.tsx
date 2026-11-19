import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { PERIOD_PRESETS, toPeriod, type DashboardPeriod } from '@/features/dashboard/dashboard.period'

/** Kỳ dài nhất cho phép (khớp backend DashboardService.MAX_PERIOD_DAYS). */
const MAX_PERIOD_DAYS = 1100

export interface DashboardPeriodPickerProps {
  value: DashboardPeriod
  onChange: (period: DashboardPeriod) => void
}

/** Chọn kỳ thống kê bất kỳ (từ ngày – đến ngày), có sẵn các mốc chọn nhanh. */
export function DashboardPeriodPicker({ value, onChange }: DashboardPeriodPickerProps) {
  const presets = useMemo(() => PERIOD_PRESETS.map((p) => ({ label: p.name, value: p.range() })), [])

  return (
    <DatePicker.RangePicker
      allowClear={false}
      format="DD/MM/YYYY"
      presets={presets}
      value={[dayjs(value.from), dayjs(value.to)]}
      disabledDate={(d, info) => {
        if (d.isAfter(dayjs(), 'day')) return true
        const from = info.from
        return Boolean(from && Math.abs(d.diff(from, 'day')) > MAX_PERIOD_DAYS)
      }}
      onChange={(dates) => {
        const [a, b] = dates ?? []
        if (a && b) onChange(toPeriod(a, b))
      }}
      aria-label="Kỳ thống kê"
    />
  )
}
