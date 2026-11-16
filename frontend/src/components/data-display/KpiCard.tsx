import { Card, Flex, Skeleton, Typography } from 'antd'
import type { ReactNode } from 'react'

export type KpiTone = 'neutral' | 'blue' | 'critical' | 'good' | 'warning'

const TONES: Record<KpiTone, { fg: string; bg: string }> = {
  neutral: { fg: '#52514e', bg: '#f2f1ee' },
  blue: { fg: '#2a78d6', bg: '#eaf2fc' },
  critical: { fg: '#d03b3b', bg: '#fcecec' },
  good: { fg: '#0a7f0a', bg: '#e9f6e9' },
  warning: { fg: '#a86e00', bg: '#fff5dd' },
}

export interface KpiCardProps {
  label: string
  value: ReactNode
  unit?: string
  icon: ReactNode
  tone?: KpiTone
  /** Dòng phụ dưới số (so sánh, ghi chú). */
  footnote?: ReactNode
  loading?: boolean
  onClick?: () => void
}

/** Ô chỉ số: nhãn, số lớn, dòng phụ; icon trong ô màu nhạt. Bấm được nếu có onClick. */
export function KpiCard({ label, value, unit, icon, tone = 'neutral', footnote, loading, onClick }: KpiCardProps) {
  const t = TONES[tone]
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}
      styles={{ body: { padding: '16px 18px' } }}
    >
      <Flex justify="space-between" align="flex-start" gap={12}>
        <Typography.Text style={{ fontSize: 13, color: '#52514e', fontWeight: 500 }}>{label}</Typography.Text>
        <Flex
          align="center"
          justify="center"
          style={{ width: 32, height: 32, borderRadius: 8, background: t.bg, color: t.fg, fontSize: 16, flexShrink: 0 }}
        >
          {icon}
        </Flex>
      </Flex>
      {loading ? (
        <Skeleton.Input active size="small" style={{ marginTop: 8, width: 80 }} />
      ) : (
        <Flex align="baseline" gap={6} style={{ marginTop: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#0b0b0b', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </span>
          {unit && <span style={{ fontSize: 13, color: '#8a8984' }}>{unit}</span>}
        </Flex>
      )}
      {footnote && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#8a8984', minHeight: 18 }}>{footnote}</div>
      )}
    </Card>
  )
}
