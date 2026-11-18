import { useQuery } from '@tanstack/react-query'
import { reportApi } from '@/features/reports/api/report.api'
import type { ReportFilter } from '@/features/reports/report.types'

export const REPORT_KEYS = {
  all: ['reports'] as const,
  monthlySummary: (f?: ReportFilter) => [...REPORT_KEYS.all, 'monthly-summary', f] as const,
  restaurantRankings: (f?: ReportFilter) => [...REPORT_KEYS.all, 'restaurant-rankings', f] as const,
  criteriaViolations: (f?: ReportFilter) => [...REPORT_KEYS.all, 'criteria-violations', f] as const,
  remediations: (f?: ReportFilter) => [...REPORT_KEYS.all, 'remediations', f] as const,
  inspectorProductivity: (f?: ReportFilter) => [...REPORT_KEYS.all, 'inspector-productivity', f] as const,
}

export function useMonthlySummary(filter?: ReportFilter) {
  return useQuery({
    queryKey: REPORT_KEYS.monthlySummary(filter),
    queryFn: () => reportApi.getMonthlySummary(filter),
  })
}

export function useRestaurantRankings(filter?: ReportFilter) {
  return useQuery({
    queryKey: REPORT_KEYS.restaurantRankings(filter),
    queryFn: () => reportApi.getRestaurantRankings(filter),
  })
}

export function useCriteriaViolations(filter?: ReportFilter) {
  return useQuery({
    queryKey: REPORT_KEYS.criteriaViolations(filter),
    queryFn: () => reportApi.getCriteriaViolations(filter),
  })
}

export function useRemediations(filter?: ReportFilter) {
  return useQuery({
    queryKey: REPORT_KEYS.remediations(filter),
    queryFn: () => reportApi.getRemediations(filter),
  })
}

export function useInspectorProductivity(filter?: ReportFilter) {
  return useQuery({
    queryKey: REPORT_KEYS.inspectorProductivity(filter),
    queryFn: () => reportApi.getInspectorProductivity(filter),
  })
}
