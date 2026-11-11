import { ROUTES } from '@/constants/routes'
import { satisfies, type PermissionHolder } from '@/permissions/permission.service'
import { PERMISSIONS, type AccessRule } from '@/permissions/permissions'

/** Điều kiện vào từng khu vực giao diện. */
export const AREA_ACCESS = {
  admin: {
    anyOf: [
      PERMISSIONS.USER.READ,
      PERMISSIONS.REPORT.READ,
      PERMISSIONS.AUDIT.READ_ALL,
      PERMISSIONS.CHECKLIST.MANAGE,
      PERMISSIONS.LOCATION.MANAGE,
    ],
  },
  qc: { anyOf: [PERMISSIONS.AUDIT.CREATE, PERMISSIONS.AUDIT.READ_OWN, PERMISSIONS.MEDIA.UPLOAD] },
} as const satisfies Record<string, AccessRule>

/** Trang chủ sau đăng nhập theo quyền: ưu tiên dashboard, không có thì giao diện chấm. */
export function getHomePath(user: PermissionHolder | null): string {
  if (satisfies(user, AREA_ACCESS.admin)) return ROUTES.admin.root
  if (satisfies(user, AREA_ACCESS.qc)) return ROUTES.qc.root
  return ROUTES.login
}
