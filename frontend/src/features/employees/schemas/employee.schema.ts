import { z } from 'zod'

/** Khớp EmployeeRequest ở backend. */
export const employeeSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã nhân viên')
    .max(30, 'Mã nhân viên tối đa 30 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới'),
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(150, 'Họ tên tối đa 150 ký tự'),
  jobTitle: z.string().trim().max(150, 'Chức danh tối đa 150 ký tự'),
  orgUnitId: z.number().nullable(),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .regex(/^[0-9 +().-]*$/, 'Số điện thoại chỉ gồm số và các ký tự + ( ) . -'),
  email: z.union([z.literal(''), z.email('Email không hợp lệ').max(150, 'Email tối đa 150 ký tự')]),
  userId: z.number().nullable(),
  active: z.boolean(),
})
export type EmployeeFormValues = z.infer<typeof employeeSchema>
