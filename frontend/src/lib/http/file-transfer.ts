import { api } from '@/lib/http/api'
import type { ImportResult } from '@/types/api.generated'

/** Upload file Excel có thể mất lâu hơn request thường (đọc + kiểm tra hàng nghìn dòng). */
const FILE_TIMEOUT_MS = 120_000

/** Tải file từ API (xuất Excel, file mẫu) và lưu về máy với tên file server đặt. */
export async function downloadFile(path: string, params?: Record<string, unknown>, fallbackName = 'du-lieu.xlsx') {
  const res = await api.get<Blob>(path, { params, responseType: 'blob', timeout: FILE_TIMEOUT_MS })
  const name = fileNameFrom(res.headers['content-disposition']) ?? fallbackName
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return name
}

/** Gửi file Excel để nhập. commit=false: chỉ kiểm tra, server không ghi gì. */
export async function uploadExcel(path: string, file: File, commit: boolean): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<ImportResult>(path, form, { params: { commit }, timeout: FILE_TIMEOUT_MS })
  return res.data
}

/** Đọc tên file từ Content-Disposition, ưu tiên filename* (UTF-8, có dấu tiếng Việt). */
function fileNameFrom(header: unknown): string | null {
  if (typeof header !== 'string') return null
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)
  if (star?.[1]) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''))
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1] ?? null
}
