import type { CSSProperties } from 'react'

/** Màu chuẩn của logo (khớp public/logo.svg và docs/brand). */
const LOGO_COLORS = { k: '#0B4FD8', check: '#47B6FF' } as const

export interface AppLogoProps {
  /** Cạnh (px) của logo, hoặc của ô nền nếu có `tile`. */
  size?: number
  /** Đặt logo trong ô vuông bo góc nền trắng (dùng trên nền tối: sidebar, ảnh nền). */
  tile?: boolean
  style?: CSSProperties
}

/** Logo KSVH QC: chữ K xanh đậm, nét dưới là dấu tích xanh nhạt. Vẽ bằng SVG nên nét ở mọi kích thước. */
export function AppLogo({ size = 36, tile = false, style }: AppLogoProps) {
  const mark = (
    <svg
      width={tile ? Math.round(size * 0.72) : size}
      height={tile ? Math.round(size * 0.72) : size}
      viewBox="0 0 600 600"
      role="img"
      aria-label="KSVH QC"
    >
      <g transform="translate(-474 -226)">
        <path
          fill={LOGO_COLORS.k}
          d="M551 280H676V437L820 293Q835 281 855 281H1018Q1033 283 1028 296L789 537Q765 514 738 515Q708 516 690 532L611 609L710 742H551Q503 742 503 694V328Q503 280 551 280Z"
        />
        <path
          fill={LOGO_COLORS.check}
          d="M666 607L712 560Q736 543 760 560L831 632L965 497Q1000 474 1033 500Q1058 534 1030 568L856 744Q820 772 786 744L668 626Q659 616 666 607Z"
        />
      </g>
    </svg>
  )
  if (!tile) return <span style={{ display: 'inline-flex', lineHeight: 0, ...style }}>{mark}</span>

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round(size * 0.28),
        background: '#ffffff',
        boxShadow: '0 4px 14px -6px rgba(0, 0, 0, 0.45)',
        ...style,
      }}
    >
      {mark}
    </span>
  )
}
