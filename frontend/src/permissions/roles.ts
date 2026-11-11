/** Nhãn hiển thị cho mã role. Chỉ dùng để HIỂN THỊ; kiểm tra quyền luôn dựa trên permission. */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị',
  MANAGER: 'Quản lý',
  AUDITOR: 'Người chấm',
}

export function roleLabel(code: string): string {
  return ROLE_LABELS[code] ?? code
}
