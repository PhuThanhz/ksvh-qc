import { severityColor } from '@/components/charts'

export interface SeverityTagProps {
  code: string
  name?: string
  /** Vị trí trong danh sách có thứ tự (0 = nhẹ nhất). */
  index: number
  total: number
}

/** Nhãn mức rủi ro: chấm màu theo độ nghiêm trọng + mã + tên (không chỉ dựa vào màu). */
export function SeverityTag({ code, name, index, total }: SeverityTagProps) {
  const color = severityColor(index, total)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px 2px 8px',
        borderRadius: 999,
        border: '1px solid #e5e4df',
        background: '#fff',
        fontSize: 12.5,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
      <b>{code}</b>
      {name && <span style={{ color: '#52514e' }}>{name}</span>}
    </span>
  )
}
