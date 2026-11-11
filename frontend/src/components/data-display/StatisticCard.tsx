import { Card, Statistic } from 'antd'
import type { ReactNode } from 'react'

export interface StatisticCardProps {
  title: string
  value: number | string | null | undefined
  loading?: boolean
  suffix?: ReactNode
  precision?: number
}

export function StatisticCard({ title, value, loading, suffix, precision }: StatisticCardProps) {
  return (
    <Card loading={loading}>
      <Statistic title={title} value={value ?? '—'} suffix={suffix} precision={precision} />
    </Card>
  )
}
