/**
 * Tiện ích tự động sinh mã định danh (Code Generator) chuẩn hoá trên toàn hệ thống KSVH QC,
 * giúp người dùng không phải tự nghĩ hoặc gõ tay các mã phiếu / mã danh mục.
 */

/** Chuyển chuỗi tiếng Việt có dấu thành chữ in hoa không dấu. */
export function stripVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
}

/**
 * Lấy chữ cái đầu của các từ trong tên để làm mã viết tắt.
 * VD: "Vệ sinh khu bếp" -> "VSKB", "Công ty Cổ phần Lotus" -> "CTCPL"
 */
export function toAcronym(name: string, maxLen = 6): string {
  const clean = stripVietnamese(name)
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim()
  if (!clean) return ''
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0]!.slice(0, maxLen)
  }
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, maxLen)
}

/**
 * Chuyển tên thành mã dạng SNAKE_UPPERCASE.
 * VD: "Giám sát vận hành" -> "GIAM_SAT_VAN_HANH"
 */
export function toUpperSnakeCode(name: string, prefix = '', maxLen = 30): string {
  const clean = stripVietnamese(name)
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
  if (!clean) return prefix
  const full = prefix ? `${prefix}_${clean}` : clean
  return full.slice(0, maxLen).replace(/_+$/, '')
}

/**
 * Tìm mã kế tiếp theo tiền tố và danh sách mã đã tồn tại.
 * VD: prefix="TPL", existing=["TPL-01", "TPL-02"] -> "TPL-03"
 */
export function nextSequentialCode(
  prefix: string,
  existingCodes: readonly string[] = [],
  pad = 2,
  separator = '-',
): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^${escaped}${separator}?(\\d+)$`, 'i')
  let max = 0
  for (const code of existingCodes) {
    const m = re.exec(code.trim())
    if (m?.[1]) {
      const n = Number.parseInt(m[1], 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  const next = max + 1
  const numStr = String(next).padStart(pad, '0')
  return `${prefix}${separator}${numStr}`
}

/**
 * Tạo mã không trùng từ chữ viết tắt của tên.
 * Nếu trùng với mã đã có trong danh sách thì nối thêm hậu tố số (-02, -03...).
 */
export function uniqueAcronymCode(
  name: string,
  existingCodes: readonly string[] = [],
  prefix = '',
  fallbackPrefix = 'MA',
): string {
  const existingSet = new Set(existingCodes.map((c) => c.trim().toUpperCase()))
  const acr = toAcronym(name, 8)
  if (!acr) {
    return nextSequentialCode(prefix || fallbackPrefix, existingCodes, 2, '-')
  }
  const base = prefix ? `${prefix}-${acr}` : acr
  if (!existingSet.has(base)) return base
  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}-${String(i).padStart(2, '0')}`
    if (!existingSet.has(candidate)) return candidate
  }
  return `${base}-${Math.floor(100 + Math.random() * 900)}`
}
