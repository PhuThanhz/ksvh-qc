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
  LOGIN: { label: 'Đăng nhập', color: 'processing' },
  ROLE_CREATE: { label: 'Tạo vai trò', color: 'purple' },
  CREATE_ROLE: { label: 'Tạo vai trò', color: 'purple' },
  ROLE_UPDATE: { label: 'Sửa vai trò', color: 'geekblue' },
  UPDATE_ROLE: { label: 'Sửa vai trò', color: 'geekblue' },
  ROLE_DELETE: { label: 'Xoá vai trò', color: 'red' },
  CRITERION_CREATE: { label: 'Tạo tiêu chí', color: 'green' },
  CREATE_CRITERION: { label: 'Tạo tiêu chí', color: 'green' },
  CRITERION_UPDATE: { label: 'Sửa tiêu chí', color: 'cyan' },
  UPDATE_CRITERION: { label: 'Sửa tiêu chí', color: 'cyan' },
  CRITERION_DELETE: { label: 'Xoá tiêu chí', color: 'red' },
  CRITERION_GROUP_CREATE: { label: 'Tạo nhóm tiêu chí', color: 'green' },
  CREATE_CRITERIA_GROUP: { label: 'Tạo nhóm tiêu chí', color: 'green' },
  CRITERION_GROUP_UPDATE: { label: 'Sửa nhóm tiêu chí', color: 'cyan' },
  UPDATE_CRITERIA_GROUP: { label: 'Sửa nhóm tiêu chí', color: 'cyan' },
  CREATE_TEMPLATE: { label: 'Tạo mẫu phiếu', color: 'purple' },
  RISK_CONFIG_UPDATE: { label: 'Đổi cấu hình rủi ro', color: 'gold' },
  UPDATE_RISK_CONFIG: { label: 'Đổi cấu hình rủi ro', color: 'gold' },
  CREATE_COMPANY: { label: 'Tạo công ty', color: 'blue' },
  UPDATE_ORG_UNIT: { label: 'Sửa nhà hàng / đơn vị', color: 'cyan' },
  CREATE_EMPLOYEE: { label: 'Tạo nhân viên', color: 'geekblue' },
  CREATE_PLAN: { label: 'Tạo kế hoạch', color: 'blue' },
  APPROVE_PLAN: { label: 'Duyệt kế hoạch', color: 'success' },
  PLAN_APPROVE: { label: 'Duyệt kế hoạch', color: 'success' },
  PLAN_REJECT: { label: 'Từ chối kế hoạch', color: 'magenta' },
  INSPECTION_CANCEL: { label: 'Huỷ phiếu kiểm tra', color: 'volcano' },
  SUBMIT_INSPECTION: { label: 'Nộp phiếu kiểm tra', color: 'cyan' },
  COMPLETE_INSPECTION: { label: 'Hoàn tất kiểm tra', color: 'success' },
  APPEAL_FINDING: { label: 'Khiếu nại lỗi', color: 'orange' },
  APPEAL_CONCLUDE: { label: 'Kết luận khiếu nại', color: 'purple' },
  SUBMIT_REMEDIATION: { label: 'Báo cáo khắc phục', color: 'lime' },
  VERIFY_FINDING: { label: 'Nghiệm thu đóng lỗi', color: 'success' },
  EXPORT_REPORT: { label: 'Xuất báo cáo', color: 'default' },
}

export const TARGET_LABELS: Record<string, string> = {
  USER: 'Người dùng',
  ROLE: 'Vai trò',
  CRITERION: 'Tiêu chí',
  CRITERION_GROUP: 'Nhóm tiêu chí',
  CRITERIA_GROUP: 'Nhóm tiêu chí',
  TEMPLATE: 'Mẫu phiếu',
  RISK_LEVEL: 'Mức rủi ro',
  FREQUENCY_CONFIG: 'Cấu hình tần suất',
  ESCALATION_RULE: 'Quy tắc nâng mức',
  INSPECTION: 'Phiếu kiểm tra',
  INSPECTION_PLAN: 'Kế hoạch kiểm tra',
  FINDING: 'Lỗi vi phạm',
  COMPANY: 'Công ty',
  ORG_UNIT: 'Nhà hàng / Đơn vị',
  EMPLOYEE: 'Nhân viên',
  AUTH: 'Xác thực',
  REPORT: 'Báo cáo',
}
