import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập').max(50, 'Tên đăng nhập tối đa 50 ký tự'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128, 'Mật khẩu tối đa 128 ký tự'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
