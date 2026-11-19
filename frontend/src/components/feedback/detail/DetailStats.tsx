import type { ReactNode } from 'react'

export type DetailStatTone = 'default' | 'good' | 'warning' | 'danger' | 'info'

export interface DetailStat {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: DetailStatTone
}

/** Dải chỉ số nhanh ngay dưới hero (vd điểm tuân thủ, số lỗi, mức rủi ro). */
export function DetailStats({ items }: { items: DetailStat[] }) {
  return (
    <div className="detail-stats" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((s, i) => (
        <div key={i} className={`detail-stat detail-stat--${s.tone ?? 'default'}`}>
          <div className="detail-stat__head">
            {s.icon && <span className="detail-stat__icon">{s.icon}</span>}
            <span className="detail-stat__label">{s.label}</span>
          </div>
          <div className="detail-stat__value">{s.value}</div>
          {s.hint && <div className="detail-stat__hint">{s.hint}</div>}
        </div>
      ))}
    </div>
  )
}
