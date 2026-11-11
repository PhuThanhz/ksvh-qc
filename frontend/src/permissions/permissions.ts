import type { Permission } from '@/types/api.generated'

export type { Permission }

/**
 * Danh mục permission phía UI. Type Permission sinh từ OpenAPI của backend:
 * backend đổi/xoá mã nào thì dòng tương ứng ở đây báo lỗi biên dịch.
 * Component KHÔNG viết chuỗi permission trực tiếp, luôn dùng PERMISSIONS.X.Y.
 */
export const PERMISSIONS = {
  USER: { READ: 'user:read', MANAGE: 'user:manage' },
  LOCATION: { READ: 'location:read', MANAGE: 'location:manage' },
  CHECKLIST: { READ: 'checklist:read', MANAGE: 'checklist:manage' },
  AUDIT: { READ_OWN: 'audit:read:own', READ_ALL: 'audit:read:all', CREATE: 'audit:create', APPROVE: 'audit:approve' },
  REPORT: { READ: 'report:read', EXPORT: 'report:export' },
  MEDIA: { UPLOAD: 'media:upload' },
} as const satisfies Record<string, Record<string, Permission>>

/**
 * Điều kiện truy cập: một permission, hoặc "có ít nhất một" (anyOf), hoặc "có tất cả" (allOf).
 */
export type AccessRule = Permission | { anyOf: readonly Permission[] } | { allOf: readonly Permission[] }
