/**
 * Chỉ chấp nhận đường dẫn nội bộ ("/admin/users"), chặn chuyển hướng ra domain khác
 * ("//evil.com", "https://evil.com") qua tham số ?redirect=.
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}
