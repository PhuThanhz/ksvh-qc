/** "2026-11" → "T11/26" cho nhãn trục tháng. */
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `T${Number(m)}/${(y ?? '').slice(2)}`
}

/** Màu mức rủi ro theo vị trí trong bảng phân loại hiện hành. */
export { severityColor as riskColor } from '@/components/charts'

export const formatNumber = (n: number) => n.toLocaleString('vi-VN')
