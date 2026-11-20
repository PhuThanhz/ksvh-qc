export interface OccurrenceSummary {
  occurredAt: string
  source: string
  findingId?: number
}

export interface CriterionRiskProfileItem {
  criterionId: number
  criterionCode: string
  criterionName: string
  groupName?: string
  baseImpact: number
  effectiveImpact: number
  isEscalated: boolean
  frequencyInPeriod: number
  totalHistoricalViolations: number
  lastViolationDate?: string
  expectedResetDate?: string
  cleanMonthsCount: number
  openFindingsCount: number
  occurrences: OccurrenceSummary[]
}

export interface RestaurantRiskProfileResponse {
  restaurantId: number
  restaurantCode: string
  restaurantName: string
  companyName?: string
  storeManagerName?: string
  asOfDate: string
  periodMonths: number
  periodStart: string
  /** true = nhà hàng có ngưỡng nâng / hạ mức riêng. */
  customEscalation: boolean
  escalationThreshold?: number | null
  resetPeriodMonths?: number
  stepIncrease?: number | null
  totalEscalatedCriteria: number
  totalActiveFindings: number
  criteria: CriterionRiskProfileItem[]
}

export interface EscalatedCriterionSummary {
  restaurantId: number
  restaurantCode: string
  restaurantName: string
  companyName?: string
  criterionId: number
  criterionCode: string
  criterionName: string
  groupName?: string
  baseImpact: number
  effectiveImpact: number
  frequencyInPeriod: number
  lastViolationDate?: string
  expectedResetDate?: string
  cleanMonthsCount: number
}
