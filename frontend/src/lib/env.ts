import { z } from 'zod'

/** Biến môi trường được kiểm tra khi khởi động; sai cấu hình thì báo lỗi ngay. */
const schema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api/v1'),
})

const parsed = schema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(`Cấu hình môi trường không hợp lệ: ${parsed.error.message}`)
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  isDev: import.meta.env.DEV,
} as const
