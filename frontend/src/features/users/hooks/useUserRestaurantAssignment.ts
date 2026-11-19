import { useCallback, useMemo, useState } from 'react'
import { useRestaurantAssignment, useSaveRestaurantAssignment } from '@/features/organizations'
import { PERMISSIONS, ROLES, usePermission } from '@/permissions'
import type { Id } from '@/types/common.types'

export interface AssignmentValue {
  storeManagerRestaurantIds: number[]
  obmRestaurantIds: number[]
}

const EMPTY: AssignmentValue = { storeManagerRestaurantIds: [], obmRestaurantIds: [] }

/**
 * Nhà hàng phụ trách của người dùng trong form Tạo / Sửa người dùng.
 * Chỉ người có quyền khai báo tổ chức mới thấy và lưu; vai trò bị bỏ thì danh sách tương ứng gửi rỗng (bỏ gán).
 */
export function useUserRestaurantAssignment(userId: Id | undefined, open: boolean) {
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.ORGANIZATION.MANAGE)
  const query = useRestaurantAssignment(userId, open && canManage)
  const saveMutation = useSaveRestaurantAssignment()
  // Giá trị người dùng đã chỉnh; null = dùng dữ liệu đang gán ở server. Mở lại form / đổi người thì bỏ chỉnh sửa cũ.
  const formKey = `${String(open)}:${String(userId)}`
  const [edited, setEdited] = useState<{ key: string; value: AssignmentValue | null }>({ key: formKey, value: null })
  if (edited.key !== formKey) setEdited({ key: formKey, value: null })

  const fromServer = useMemo<AssignmentValue>(() => {
    const data = query.data
    return data
      ? { storeManagerRestaurantIds: data.storeManagerOf.map((r) => r.id), obmRestaurantIds: data.obmOf.map((r) => r.id) }
      : EMPTY
  }, [query.data])
  const value = edited.key === formKey && edited.value ? edited.value : fromServer
  const setValue = useCallback((v: AssignmentValue) => setEdited({ key: formKey, value: v }), [formKey])

  /** Gọi sau khi đã lưu người dùng (vai trò mới đã có hiệu lực ở server). */
  const save = useCallback(
    async (targetUserId: Id, roles: readonly string[], isNew: boolean) => {
      if (!canManage) return
      const body: AssignmentValue = {
        storeManagerRestaurantIds: roles.includes(ROLES.STORE_MANAGER) ? value.storeManagerRestaurantIds : [],
        obmRestaurantIds: roles.includes(ROLES.OBM) ? value.obmRestaurantIds : [],
      }
      const empty = body.storeManagerRestaurantIds.length === 0 && body.obmRestaurantIds.length === 0
      if (isNew && empty) return
      await saveMutation.mutateAsync({ userId: targetUserId, body })
    },
    [canManage, value, saveMutation],
  )

  return {
    canManage,
    value,
    setValue,
    current: query.data,
    loading: query.isFetching,
    saving: saveMutation.isPending,
    save,
  }
}
