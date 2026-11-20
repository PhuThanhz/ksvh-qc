import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useEscalationRules } from '@/features/criteria/hooks/useRiskConfig'

/** Quy tắc nâng mức chung đang hiệu lực (bản có ngày hiệu lực gần nhất, không sau hôm nay). */
export function useCurrentEscalationRule() {
  const rules = useEscalationRules()
  return useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return [...(rules.data ?? [])]
      .filter((r) => r.effectiveFrom <= today)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
  }, [rules.data])
}
