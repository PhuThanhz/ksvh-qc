import { memo } from 'react'

export interface RiskLevelTagProps {
  code?: string | number | null
  name?: string | null
  showName?: boolean
  className?: string
  style?: React.CSSProperties
}

export function getRiskLevelClass(code?: string | number | null): string {
  if (code == null) return 'risk-tag--default'
  const str = String(code).trim().toUpperCase()
  if (str === 'M1' || str === '1') return 'risk-tag--m1'
  if (str === 'M2' || str === '2') return 'risk-tag--m2'
  if (str === 'M3' || str === '3') return 'risk-tag--m3'
  if (str === 'M4' || str === '4') return 'risk-tag--m4'
  if (str === 'M5' || str === '5') return 'risk-tag--m5'
  if (str.startsWith('M1') || str.includes('1')) return 'risk-tag--m1'
  if (str.startsWith('M2') || str.includes('2')) return 'risk-tag--m2'
  if (str.startsWith('M3') || str.includes('3')) return 'risk-tag--m3'
  if (str.startsWith('M4') || str.includes('4')) return 'risk-tag--m4'
  if (str.startsWith('M5') || str.includes('5')) return 'risk-tag--m5'
  return 'risk-tag--default'
}

/**
 * Thẻ hiển thị mã mức độ rủi ro (M1–M4/M5) với tone màu chuẩn cấp độ khẩn cấp:
 * - M1 (Thấp): Xanh lá (Green)
 * - M2 (Trung bình): Xanh dương (Blue)
 * - M3 (Cao / Cảnh báo): Vàng cam (Orange / Amber)
 * - M4 (Khẩn cấp / Nguy hiểm): Đỏ (Red)
 * - M5 (Nghiêm trọng): Đỏ sẫm / Tím
 */
export const RiskLevelTag = memo(function RiskLevelTag({
  code,
  name,
  showName = false,
  className = '',
  style,
}: RiskLevelTagProps) {
  if (!code && !name) return <span>—</span>

  const toneClass = getRiskLevelClass(code)
  const displayCode = code ? String(code).trim().toUpperCase() : ''

  return (
    <span
      className={`risk-tag ${toneClass} ${className}`.trim()}
      style={style}
      title={name ? `${displayCode} – ${name}` : displayCode}
    >
      {displayCode}
      {showName && name && (
        <span style={{ marginInlineStart: 4, fontWeight: 500 }}>
          - {name}
        </span>
      )}
    </span>
  )
})
