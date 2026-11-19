import { Tag } from 'antd'
import type { CSSProperties } from 'react'
import {
  ORG_UNIT_TYPE_LABEL,
  type OrgUnitType,
} from '@/features/organizations/organizations.types'

export interface OrgUnitTypeTagProps {
  type: OrgUnitType
  style?: CSSProperties
  onClick?: () => void
}

/**
 * Tag hiển thị loại đơn vị tổ chức với 2 tông màu pastel nhẹ nhàng:
 * - RESTAURANT (Nhà hàng): Cam ấm pastel (#fff7ed / #c2410c)
 * - DEPARTMENT (Phòng ban): Tím lavender pastel (#f5f3ff / #6d28d9)
 */
export function OrgUnitTypeTag({ type, style, onClick }: OrgUnitTypeTagProps) {
  const isRestaurant = type === 'RESTAURANT'
  return (
    <Tag
      className={isRestaurant ? 'unit-tag unit-tag--restaurant' : 'unit-tag unit-tag--department'}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
    >
      {ORG_UNIT_TYPE_LABEL[type]}
    </Tag>
  )
}
