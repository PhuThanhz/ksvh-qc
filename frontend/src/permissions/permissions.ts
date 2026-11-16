import type { Permission } from '@/types/api.generated'

export type { Permission }

/**
 * Danh mục permission phía UI. Type Permission sinh từ OpenAPI của backend:
 * backend đổi/xoá mã nào thì dòng tương ứng ở đây báo lỗi biên dịch.
 * Component KHÔNG viết chuỗi permission trực tiếp, luôn dùng PERMISSIONS.X.Y.
 */
export const PERMISSIONS = {
  USER: { READ: 'user:read', MANAGE: 'user:manage' },
  ROLE: { MANAGE: 'role:manage' },
  EMPLOYEE: { READ: 'employee:read', MANAGE: 'employee:manage' },
  SYSTEM: { CONFIG: 'system:config', LOG_READ: 'system:log:read' },
  ORGANIZATION: { READ: 'organization:read', MANAGE: 'organization:manage' },
  CRITERIA: { READ: 'criteria:read', MANAGE: 'criteria:manage' },
  PLAN: { READ: 'plan:read', CREATE: 'plan:create', APPROVE: 'plan:approve' },
  INSPECTION: {
    READ_OWN: 'inspection:read:own',
    READ_ALL: 'inspection:read:all',
    PERFORM: 'inspection:perform',
    CANCEL: 'inspection:cancel',
  },
  FINDING: {
    RESPOND: 'finding:respond',
    REVIEW_APPEAL: 'finding:review-appeal',
    CONCLUDE_APPEAL: 'finding:conclude-appeal',
    REMEDIATE: 'finding:remediate',
    VERIFY: 'finding:verify',
  },
  REPORT: { READ: 'report:read', EXPORT: 'report:export' },
  MEDIA: { UPLOAD: 'media:upload' },
} as const satisfies Record<string, Record<string, Permission>>

/**
 * Điều kiện truy cập: một permission, hoặc "có ít nhất một" (anyOf), hoặc "có tất cả" (allOf).
 */
export type AccessRule = Permission | { anyOf: readonly Permission[] } | { allOf: readonly Permission[] }
