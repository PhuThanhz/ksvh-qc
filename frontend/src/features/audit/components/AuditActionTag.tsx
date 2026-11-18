import { Tag } from 'antd'
import { ACTION_LABELS } from '@/features/audit/audit.types'

interface Props {
  action: string
}

export function AuditActionTag({ action }: Props) {
  const meta = ACTION_LABELS[action]
  if (!meta) {
    return <Tag color="default">{action}</Tag>
  }
  return <Tag color={meta.color}>{meta.label}</Tag>
}
