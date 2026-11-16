import { z } from 'zod'

const password = z
  .string()
  .min(8, 'Mật khẩu 8–128 ký tự')
  .max(128, 'Mật khẩu 8–128 ký tự')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Mật khẩu phải có cả chữ và số')

const base = {
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(150, 'Họ tên tối đa 150 ký tự'),
  roles: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một vai trò'),
  active: z.boolean(),
}

/** Khớp UserCreateRequest ở backend. */
export const userCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9._-]{3,50}$/, 'Tên đăng nhập 3–50 ký tự: chữ không dấu, số, dấu chấm, gạch ngang, gạch dưới'),
  password,
  ...base,
})
export type UserCreateValues = z.infer<typeof userCreateSchema>

/** Khớp UserUpdateRequest: không đổi tên đăng nhập, mật khẩu đổi riêng. */
export const userUpdateSchema = z.object(base)
export type UserUpdateValues = z.infer<typeof userUpdateSchema>

export const passwordResetSchema = z
  .object({ newPassword: password, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Mật khẩu nhập lại không khớp' })
export type PasswordResetValues = z.infer<typeof passwordResetSchema>
