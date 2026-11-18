import type { AuditLogResponse } from '@/types/api.generated'

export type { AuditLogResponse }

export interface AuditLogSearchParams extends Record<string, unknown> {
  keyword?: string
  action?: string
  targetType?: string
  userId?: number
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
}

export const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  USER_CREATE: { label: 'Tạo người dùng', color: 'blue' },
  USER_UPDATE: { label: 'Sửa người dùng', color: 'cyan' },
  USER_RESET_PASSWORD: { label: 'Đổi mật khẩu', color: 'orange' },
  USER_DELETE: { label: 'Xoá người dùng', color: 'red' },
  ROLE_CREATE: { label: 'Tạo vai trò', color: 'purple' },
  ROLE_UPDATE: { label: 'Sửa vai trò', color: 'geekblue' },
  ROLE_DELETE: { label: 'Xoá vai trò', color: 'red' },
  CRITERION_CREATE: { label: 'Tạo tiêu chí', color: 'green' },
  CRITERION_UPDATE: { label: 'Sửa tiêu chí', color: 'cyan' },
  CRITERION_DELETE: { label: 'Xoá tiêu chí', color: 'red' },
  CRITERION_GROUP_CREATE: { label: 'Tạo nhóm tiêu chí', color: 'green' },
  CRITERION_GROUP_UPDATE: { label: 'Sửa nhóm tiêu chí', color: 'cyan' },
  RISK_CONFIG_UPDATE: { label: 'Đổi cấu hình rủi ro', color: 'gold' },
  INSPECTION_CANCEL: { label: 'Huỷ phiếu kiểm tra', color: 'volcano' },
  PLAN_APPROVE: { label: 'Duyệt kế hoạch', color: 'success' },
  PLAN_REJECT: { label: 'Từ chối kế hoạch', color: 'magenta' },
  APPEAL_CONCLUDE: { label: 'Kết luận khiếu nại', color: 'purple' },
}

export const TARGET_LABELS: Record<string, string> = {
  USER: 'Người dùng',
  ROLE: 'Vai trò',
  CRITERION: 'Tiêu chí',
  CRITERION_GROUP: 'Nhóm tiêu chí',
  TEMPLATE: 'Mẫu phiếu',
  RISK_LEVEL: 'Mức rủi ro',
  FREQUENCY_CONFIG: 'Cấu hình tần suất',
  ESCALATION_RULE: 'Quy tắc nâng mức',
  INSPECTION: 'Phiếu kiểm tra',
  INSPECTION_PLAN: 'Kế hoạch kiểm tra',
  FINDING: 'Lỗi vi phạm',
}
