export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (from: string, to: string) => [...dashboardKeys.all, 'summary', from, to] as const,
}
