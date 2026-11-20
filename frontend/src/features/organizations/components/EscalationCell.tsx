import { Tag } from 'antd'
import { useCurrentEscalationRule } from '@/features/organizations/hooks/useCurrentEscalationRule'
import { hasEscalationOverride, type EscalationOverride } from '@/features/organizations/organizations.types'

interface Item {
  label: string
  own: number | null | undefined
  common?: number
  unit: string
}

/**
 * Ô "Ngưỡng nâng mức" của bảng nhà hàng: nhà hàng dùng ngưỡng riêng hiện tag cam + từng thông số,
 * thông số khác quy tắc chung được tô cam kèm giá trị chung để so sánh. Không có ngưỡng riêng → chữ mờ.
 */
export function EscalationCell({ unit }: { unit: EscalationOverride }) {
  const rule = useCurrentEscalationRule()
  if (!hasEscalationOverride(unit)) return <span className="cell-sub">Theo quy tắc chung</span>

  const items: Item[] = [
    { label: 'Nâng từ', own: unit.escalationThreshold, common: rule?.thresholdCount, unit: 'lần' },
    { label: 'Mỗi lần', own: unit.escalationStep, common: rule?.stepIncrease, unit: 'bậc' },
    { label: 'Hạ sau', own: unit.escalationResetMonths, common: rule?.resetPeriodMonths, unit: 'tháng' },
  ]

  return (
    <div className="esc-cell">
      <Tag color="orange">Ngưỡng riêng</Tag>
      <div className="esc-cell__items">
        {items.map((it) => {
          const custom = it.own != null && it.own !== it.common
          const value = it.own ?? it.common
          return (
            <span key={it.label} className={custom ? 'esc-cell__item is-custom' : 'esc-cell__item'}>
              {it.label} <b>{it.label === 'Mỗi lần' ? `+${value ?? '—'}` : (value ?? '—')}</b> {it.unit}
              {custom && it.common != null && <em> (chung {it.common})</em>}
            </span>
          )
        })}
      </div>
    </div>
  )
}
