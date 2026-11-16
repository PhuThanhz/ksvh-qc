import { Tag } from 'antd'

const COLORS = ['', 'green', 'gold', 'orange', 'volcano', 'red'] as const

/** Hiển thị mức ảnh hưởng 1–5 (màu đậm dần). */
export function ImpactTag({ value }: { value: number }) {
  return <Tag color={COLORS[value] || 'default'}>Mức {value}</Tag>
}
