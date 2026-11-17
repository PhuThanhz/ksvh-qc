/**
 * Chuyển đổi đường dẫn ảnh (có thể là URL đầy đủ hoặc MinIO object key)
 * thành URL hợp lệ để hiển thị trên trình duyệt.
 */
export function toMediaUrl(urlOrKey?: string | null): string {
  if (!urlOrKey) return ''
  const trimmed = urlOrKey.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }
  const storageEndpoint = (import.meta as unknown as { env: { VITE_STORAGE_PUBLIC_URL?: string } }).env.VITE_STORAGE_PUBLIC_URL || 'http://localhost:9000/ksvh-qc'
  return `${storageEndpoint.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`
}

/** Tách chuỗi URL/Key phân cách bởi dấu phẩy thành mảng */
export function parseMediaUrls(urls?: string | null): string[] {
  if (!urls) return []
  return urls.split(',').map((u) => u.trim()).filter(Boolean)
}
