import { Tag } from 'antd'
import { memo } from 'react'

const COLORS = ['', 'green', 'gold', 'orange', 'volcano', 'red'] as const

/** Hiển thị mức ảnh hưởng 1–5 (màu đậm dần). */
export const ImpactTag = memo(function ImpactTag({ value }: { value: number }) {
  return <Tag color={COLORS[value] || 'default'}>Mức {value}</Tag>
})
