import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CONFIG_STATUS_META, type ConfigStatus } from '@/features/criteria/criteria.types'

export function ConfigStatusTag({ status }: { status: ConfigStatus }) {
  return <StatusBadge status={status} meta={CONFIG_STATUS_META} />
}
