export interface ReportFilter {
  from?: string
  to?: string
  companyId?: number
  restaurantId?: number
  inspectorId?: number
  groupId?: number
}

export interface MonthlySummaryItem {
  month: string
  totalInspections: number
  periodicCount: number
  adHocCount: number
  completedCount: number
  complianceRate: number
  totalFindings: number
  m1Count: number
  m2Count: number
  m3Count: number
  m4Count: number
}

export interface MonthlySummaryReportResponse {
  items: MonthlySummaryItem[]
  summary?: MonthlySummaryItem
}

export interface RestaurantRankingItem {
  restaurantId: number
  restaurantCode: string
  restaurantName: string
  companyName?: string
  storeManagerName?: string
  inspectionCount: number
  averageScore: number
  complianceRate: number
  openFindingsCount: number
  m1Count: number
  m2Count: number
  m3Count: number
  m4Count: number
  rankCategory: string
}

export interface RestaurantRankingReportResponse {
  items: RestaurantRankingItem[]
}

export interface CriteriaViolationItem {
  criterionId: number
  criterionCode: string
  criterionName: string
  groupName?: string
  baseImpact: number
  violationCount: number
  restaurantCount: number
  repeatCount: number
  openCount: number
  closedCount: number
  paretoPercentage: number
}

export interface CriteriaViolationReportResponse {
  items: CriteriaViolationItem[]
  totalViolations: number
}

export interface RemediationStatusItem {
  restaurantId: number
  restaurantCode: string
  restaurantName: string
  companyName?: string
  storeManagerName?: string
  totalFindings: number
  resolvedOnTimeCount: number
  resolvedOverdueCount: number
  overdueOpenCount: number
  inProgressCount: number
  onTimeRate: number
}

export interface RemediationStatusReportResponse {
  items: RemediationStatusItem[]
  summary?: RemediationStatusItem
}

export interface InspectorProductivityItem {
  inspectorId: number
  inspectorUsername: string
  inspectorFullName: string
  totalAssigned: number
  completedInspections: number
  avgDurationMinutes: number
  totalFindingsFound: number
  m3m4Count: number
  avgFindingsPerInspection: number
}

export interface InspectorProductivityReportResponse {
  items: InspectorProductivityItem[]
}
