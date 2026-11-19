import dayjs, { type Dayjs } from 'dayjs'

/** Kỳ thống kê của trang Tổng quan: [from, to] (YYYY-MM-DD, cả hai ngày tính) + nhãn hiển thị. */
export interface DashboardPeriod {
  from: string
  to: string
  /** Dùng trong câu, vd "6 tháng qua", "năm 2026", "10/02/2026 – 05/04/2026". */
  label: string
}

const ISO = 'YYYY-MM-DD'

interface PeriodPreset {
  /** Nhãn trên nút chọn nhanh. */
  name: string
  /** Nhãn dùng trong câu mô tả. */
  label: string
  range: () => [Dayjs, Dayjs]
}

/** "N tháng qua" = từ đầu tháng thứ N tính lùi đến hôm nay (khớp mặc định ở backend). */
const lastMonths = (n: number): [Dayjs, Dayjs] => [dayjs().startOf('month').subtract(n - 1, 'month'), dayjs()]

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  { name: 'Tháng này', label: 'tháng này', range: () => lastMonths(1) },
  { name: '3 tháng qua', label: '3 tháng qua', range: () => lastMonths(3) },
  { name: '6 tháng qua', label: '6 tháng qua', range: () => lastMonths(6) },
  { name: '12 tháng qua', label: '12 tháng qua', range: () => lastMonths(12) },
  { name: 'Năm nay', label: `năm ${dayjs().year()}`, range: () => [dayjs().startOf('year'), dayjs()] },
  {
    name: 'Năm trước',
    label: `năm ${dayjs().year() - 1}`,
    range: () => [dayjs().subtract(1, 'year').startOf('year'), dayjs().subtract(1, 'year').endOf('year')],
  },
]

/** Tạo kỳ từ hai ngày; trùng mốc chọn nhanh thì dùng nhãn của mốc đó. */
export function toPeriod(start: Dayjs, end: Dayjs): DashboardPeriod {
  const from = start.format(ISO)
  const to = end.format(ISO)
  const preset = PERIOD_PRESETS.find((p) => {
    const [a, b] = p.range()
    return a.format(ISO) === from && b.format(ISO) === to
  })
  const label = preset ? preset.label : `${start.format('DD/MM/YYYY')} – ${end.format('DD/MM/YYYY')}`
  return { from, to, label }
}

export const DEFAULT_PERIOD_PRESET = '6 tháng qua'

export function defaultPeriod(): DashboardPeriod {
  const preset = PERIOD_PRESETS.find((p) => p.name === DEFAULT_PERIOD_PRESET) ?? PERIOD_PRESETS[0]
  const [a, b] = preset ? preset.range() : lastMonths(6)
  return toPeriod(a, b)
}
