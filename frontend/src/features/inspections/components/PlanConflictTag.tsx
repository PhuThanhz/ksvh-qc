import { WarningOutlined } from '@ant-design/icons'
import { Popover, Tag } from 'antd'
import dayjs from 'dayjs'
import type { ScheduleEntry } from '@/features/inspections/hooks/useInspectorConflicts'

export interface PlanConflictTagProps {
  date: string
  entries: readonly ScheduleEntry[]
}

/** Thẻ cảnh báo chuyên viên có nhiều nhà hàng cùng ngày; rê chuột xem các lịch trùng. */
export function PlanConflictTag({ date, entries }: PlanConflictTagProps) {
  if (entries.length < 2) return null
  const content = (
    <div style={{ maxWidth: 320 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Ngày {dayjs(date).format('DD/MM/YYYY')} có {entries.length} nhà hàng:</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {entries.map((e, i) => (
          <li key={`${e.restaurantId}-${i}`}>
            {e.restaurantName ?? `#${e.restaurantId}`}{' '}
            <span style={{ color: '#64748b' }}>{e.planCode ? `· kế hoạch ${e.planCode}` : '· kế hoạch này'}</span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>Chỉ cảnh báo, vẫn lưu được. Đổi ngày hoặc chuyên viên nếu cần.</div>
    </div>
  )
  return (
    <Popover content={content} title="Trùng lịch chuyên viên">
      <Tag color="warning" icon={<WarningOutlined />} style={{ marginTop: 4, cursor: 'help' }}>
        Trùng lịch: {entries.length} nhà hàng ngày {dayjs(date).format('DD/MM')}
      </Tag>
    </Popover>
  )
}
