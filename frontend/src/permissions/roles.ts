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
