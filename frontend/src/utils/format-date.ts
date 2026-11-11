import dayjs from 'dayjs'

/** Backend trả thời gian ISO-8601 UTC; hiển thị theo giờ máy người dùng. */
export function formatDateTime(value: string | null | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—'
}

export function formatDate(value: string | null | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY') : '—'
}
