import { Form } from 'antd'
import { RestaurantMultiPicker, type AssignedRestaurant } from '@/features/organizations'
import type { AssignmentValue } from '@/features/users/hooks/useUserRestaurantAssignment'
import { ROLES } from '@/permissions'

export interface RestaurantAssignmentFieldsProps {
  roles: readonly string[]
  value: AssignmentValue
  onChange: (value: AssignmentValue) => void
  userId?: number
  current?: { storeManagerOf: readonly AssignedRestaurant[]; obmOf: readonly AssignedRestaurant[] }
}

/** Ô chọn nhà hàng phụ trách, chỉ hiện khi người dùng có vai trò Cửa hàng trưởng hoặc OBM. */
export function RestaurantAssignmentFields({ roles, value, onChange, userId, current }: RestaurantAssignmentFieldsProps) {
  const isStoreManager = roles.includes(ROLES.STORE_MANAGER)
  const isObm = roles.includes(ROLES.OBM)
  if (!isStoreManager && !isObm) return null

  return (
    <>
      {isStoreManager && (
        <Form.Item label="Nhà hàng phụ trách (Cửa hàng trưởng)" extra="Mỗi nhà hàng chỉ có một Cửa hàng trưởng.">
          <RestaurantMultiPicker
            slot="storeManager"
            selfUserId={userId}
            current={current?.storeManagerOf}
            value={value.storeManagerRestaurantIds}
            onChange={(ids) => onChange({ ...value, storeManagerRestaurantIds: ids })}
          />
        </Form.Item>
      )}
      {isObm && (
        <Form.Item label="Nhà hàng phụ trách (OBM)" extra="Mỗi nhà hàng chỉ có một OBM.">
          <RestaurantMultiPicker
            slot="obm"
            selfUserId={userId}
            current={current?.obmOf}
            value={value.obmRestaurantIds}
            onChange={(ids) => onChange({ ...value, obmRestaurantIds: ids })}
          />
        </Form.Item>
      )}
    </>
  )
}
