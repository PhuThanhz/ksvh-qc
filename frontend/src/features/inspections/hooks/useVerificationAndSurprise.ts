import { useQuery } from '@tanstack/react-query'
import { findingsApi, inspectionsApi, plansApi } from '@/features/inspections/api/inspection.api'
import type { CandidateFindingResponse, PriorFindingsWarning, SurpriseInspectionSuggestion } from '@/features/inspections/inspection.types'

export const surpriseKeys = {
  all: ['inspections', 'surprise'] as const,
  suggestions: () => [...surpriseKeys.all, 'suggestions'] as const,
  verificationCandidates: (restaurantId?: number) => ['findings', 'verification-candidates', restaurantId] as const,
  planWarning: (restaurantId?: number, beforeDate?: string) => ['plans', 'restaurant-warning', restaurantId, beforeDate] as const,
}

export function useVerificationCandidates(restaurantId?: number) {
  return useQuery<CandidateFindingResponse[]>({
    queryKey: surpriseKeys.verificationCandidates(restaurantId),
    queryFn: () => findingsApi.verificationCandidates(restaurantId!),
    enabled: Boolean(restaurantId),
  })
}

export function useSurpriseSuggestions() {
  return useQuery<SurpriseInspectionSuggestion[]>({
    queryKey: surpriseKeys.suggestions(),
    queryFn: () => inspectionsApi.surpriseSuggestions(),
  })
}

export function useRestaurantPlanWarning(restaurantId?: number, beforeDate?: string) {
  return useQuery<PriorFindingsWarning>({
    queryKey: surpriseKeys.planWarning(restaurantId, beforeDate),
    queryFn: () => plansApi.restaurantWarning(restaurantId!, beforeDate),
    enabled: Boolean(restaurantId),
  })
}
