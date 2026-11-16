/** Mã role (khớp backend RoleCodes). Chỉ dùng khi nghiệp vụ cần đúng vai trò, vd lọc người để gán làm CHT. */
export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  BUSINESS_ADMIN: 'BUSINESS_ADMIN',
  KSVH_LEAD: 'KSVH_LEAD',
  KSVH_MANAGER: 'KSVH_MANAGER',
  KSVH_INSPECTOR: 'KSVH_INSPECTOR',
  STORE_MANAGER: 'STORE_MANAGER',
  OBM: 'OBM',
  EXECUTIVE: 'EXECUTIVE',
} as const

/** Nhãn hiển thị cho mã role (docs/DOMAIN_SPEC.md §2). Chỉ dùng để HIỂN THỊ; kiểm tra quyền luôn dựa trên permission. */
export const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  BUSINESS_ADMIN: 'Quản trị nghiệp vụ',
  KSVH_LEAD: 'Trưởng nhóm KSVH',
  KSVH_MANAGER: 'Quản lý KSVH',
  KSVH_INSPECTOR: 'Chuyên viên KSVH',
  STORE_MANAGER: 'Cửa hàng trưởng',
  OBM: 'OBM',
  EXECUTIVE: 'Ban Giám đốc',
}

export function roleLabel(code: string): string {
  return ROLE_LABELS[code] ?? code
}
