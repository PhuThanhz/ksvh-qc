import type {
  EscalatedCriterionSummary,
  RestaurantRiskProfileResponse,
} from '@/features/inspections/risk-profile.types'
import { api } from '@/lib/http'

export const riskProfileApi = {
  getRestaurantRiskProfile: (restaurantId: number, asOfDate?: string) =>
    api
      .get<RestaurantRiskProfileResponse>(`/restaurants/${restaurantId}/risk-profile`, {
        params: { asOfDate: asOfDate || undefined },
      })
      .then((r) => r.data),

  getEscalatedCriteria: (asOfDate?: string) =>
    api
      .get<EscalatedCriterionSummary[]>('/risk/escalated-criteria', {
        params: { asOfDate: asOfDate || undefined },
      })
      .then((r) => r.data),
}
