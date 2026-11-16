import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'

type ActiveKey = 'active' | 'inactive'
const ACTIVE_META: Record<ActiveKey, { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  inactive: { label: 'Ngưng hoạt động', tone: 'default' },
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <StatusBadge status={active ? 'active' : 'inactive'} meta={ACTIVE_META} />
}
