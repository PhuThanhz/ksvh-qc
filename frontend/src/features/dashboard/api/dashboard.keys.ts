export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (months: number) => [...dashboardKeys.all, 'summary', months] as const,
}
