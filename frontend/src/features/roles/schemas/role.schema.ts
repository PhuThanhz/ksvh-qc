import { z } from 'zod'

/** Khớp RoleRequest ở backend. */
export const roleSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{1,49}$/, 'Mã vai trò gồm chữ in hoa không dấu, số, dấu gạch dưới; bắt đầu bằng chữ; 2–50 ký tự'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên vai trò').max(100, 'Tên vai trò tối đa 100 ký tự'),
  description: z.string().trim().max(255, 'Mô tả tối đa 255 ký tự'),
  permissions: z.array(z.string()),
})
export type RoleFormValues = z.infer<typeof roleSchema>
