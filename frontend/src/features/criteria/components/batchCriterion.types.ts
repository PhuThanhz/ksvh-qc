export interface BatchItem {
  key: string
  name: string
  baseImpact: number
  checkMethod: string
  evidenceRequired: string
}

/** Màu chấm cho mức ảnh hưởng 1–5 (đậm dần theo mức). */
export const IMPACT_DOT: Record<number, string> = { 1: '#16a34a', 2: '#ca8a04', 3: '#ea580c', 4: '#dc2626', 5: '#991b1b' }
export const IMPACT_NAME: Record<number, string> = { 1: 'Rất nhẹ', 2: 'Nhẹ', 3: 'Trung bình', 4: 'Nặng', 5: 'Nghiêm trọng' }
export const DEFAULT_IMPACT = 2

export function getPrefix(groupCode?: string): string {
  if (!groupCode) return 'TC'
  return groupCode.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'TC'
}

export const formatCode = (prefix: string, seq: number) => `${prefix}-${seq.toString().padStart(2, '0')}`

let counter = 0
export function newRow(partial?: Partial<BatchItem>): BatchItem {
  counter += 1
  return { key: `row-${Date.now()}-${counter}`, name: '', baseImpact: DEFAULT_IMPACT, checkMethod: '', evidenceRequired: '', ...partial }
}

/**
 * Đọc nội dung dán từ Excel / Word. Mỗi dòng một tiêu chí; nếu dán từ Excel (cách nhau bằng Tab):
 * cột 1 = nội dung, cột 2 = mức ảnh hưởng 1–5 (tuỳ chọn), cột 3 = phương pháp đánh giá (tuỳ chọn).
 */
export function parsePasted(text: string): Pick<BatchItem, 'name' | 'baseImpact' | 'checkMethod'>[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.split('\t').map((c) => c.trim())
      const name = (cols[0] ?? '').replace(/^[-*•\d.)\s]+/, '').trim()
      const impact = Number(cols[1])
      const hasImpact = Number.isInteger(impact) && impact >= 1 && impact <= 5
      return { name, baseImpact: hasImpact ? impact : DEFAULT_IMPACT, checkMethod: (hasImpact ? cols[2] : cols[1]) ?? '' }
    })
    .filter((r) => r.name.length > 0)
}
