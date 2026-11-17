import { useQuery } from '@tanstack/react-query'
import { riskProfileApi } from '@/features/inspections/api/risk-profile.api'

export const RISK_PROFILE_KEYS = {
  all: ['risk-profile'] as const,
  restaurant: (restaurantId?: number, asOfDate?: string) =>
    [...RISK_PROFILE_KEYS.all, 'restaurant', restaurantId, asOfDate] as const,
  escalatedCriteria: (asOfDate?: string) =>
    [...RISK_PROFILE_KEYS.all, 'escalated-criteria', asOfDate] as const,
}

export function useRestaurantRiskProfile(restaurantId?: number, asOfDate?: string) {
  return useQuery({
    queryKey: RISK_PROFILE_KEYS.restaurant(restaurantId, asOfDate),
    queryFn: () => (restaurantId ? riskProfileApi.getRestaurantRiskProfile(restaurantId, asOfDate) : null),
    enabled: !!restaurantId,
  })
}

export function useEscalatedCriteria(asOfDate?: string) {
  return useQuery({
    queryKey: RISK_PROFILE_KEYS.escalatedCriteria(asOfDate),
    queryFn: () => riskProfileApi.getEscalatedCriteria(asOfDate),
  })
}
