/** Hằng số dùng chung. Không viết số "thần kỳ" rải rác trong code. */

export const HTTP_TIMEOUT_MS = 20_000
export const UPLOAD_TIMEOUT_MS = 60_000

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const SEARCH_DEBOUNCE_MS = 400

/** GPS: sai số tối đa chấp nhận (mét) và thời gian dò tối đa. */
export const GPS_MAX_ACCURACY_M = 50
export const GPS_TIMEOUT_MS = 15_000

/** Ảnh bằng chứng: kích thước cạnh dài nhất và dung lượng sau nén. */
export const IMAGE_MAX_DIMENSION_PX = 1600
export const IMAGE_MAX_SIZE_MB = 0.6
export const IMAGE_JPEG_QUALITY = 0.85

/** Số lần TanStack Query thử lại khi lỗi mạng/5xx (không thử lại lỗi 4xx). */
export const QUERY_MAX_RETRIES = 2
