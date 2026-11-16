import { ROUTES } from '@/constants/routes'
import { satisfies, type PermissionHolder } from '@/permissions/permission.service'
import { PERMISSIONS, type AccessRule } from '@/permissions/permissions'

/** Điều kiện vào từng khu vực giao diện. */
export const AREA_ACCESS = {
  /** Dashboard: quản trị, Phòng KSVH, Ban Giám đốc. */
  admin: {
    anyOf: [
      PERMISSIONS.USER.READ,
      PERMISSIONS.ROLE.MANAGE,
      PERMISSIONS.EMPLOYEE.READ,
      PERMISSIONS.ORGANIZATION.MANAGE,
      PERMISSIONS.CRITERIA.MANAGE,
      PERMISSIONS.PLAN.READ,
      PERMISSIONS.INSPECTION.READ_ALL,
      PERMISSIONS.REPORT.READ,
    ],
  },
  /** Giao diện điện thoại: Chuyên viên chấm/nghiệm thu, CHT xác nhận/khắc phục, người thẩm định khiếu nại. */
  qc: {
    anyOf: [
      PERMISSIONS.INSPECTION.PERFORM,
      PERMISSIONS.INSPECTION.READ_OWN,
      PERMISSIONS.FINDING.RESPOND,
      PERMISSIONS.FINDING.REMEDIATE,
      PERMISSIONS.FINDING.VERIFY,
      PERMISSIONS.FINDING.REVIEW_APPEAL,
    ],
  },
} as const satisfies Record<string, AccessRule>

/** Trang chủ sau đăng nhập theo quyền: ưu tiên dashboard, không có thì giao diện chấm. */
export function getHomePath(user: PermissionHolder | null): string {
  if (satisfies(user, AREA_ACCESS.admin)) return ROUTES.admin.root
  if (satisfies(user, AREA_ACCESS.qc)) return ROUTES.qc.root
  return ROUTES.login
}
