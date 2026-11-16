import { z } from 'zod'

const CODE_RULE = /^[A-Za-z0-9_-]+$/
const CODE_MESSAGE = 'Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới'

export const companySchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã công ty').max(30, 'Mã công ty tối đa 30 ký tự').regex(CODE_RULE, CODE_MESSAGE),
  name: z.string().trim().min(1, 'Vui lòng nhập tên công ty').max(200, 'Tên công ty tối đa 200 ký tự'),
  active: z.boolean(),
})
export type CompanyFormValues = z.infer<typeof companySchema>

/** Khớp kiểm tra ở server (OrgUnitRequest + OrgUnitService): nhà hàng bắt buộc toạ độ và bán kính. */
export const orgUnitSchema = z
  .object({
    companyId: z.number({ error: 'Vui lòng chọn công ty' }).nullable(),
    unitType: z.enum(['RESTAURANT', 'DEPARTMENT']),
    code: z.string().trim().min(1, 'Vui lòng nhập mã đơn vị').max(30, 'Mã đơn vị tối đa 30 ký tự').regex(CODE_RULE, CODE_MESSAGE),
    name: z.string().trim().min(1, 'Vui lòng nhập tên đơn vị').max(200, 'Tên đơn vị tối đa 200 ký tự'),
    address: z.string().trim().max(500, 'Địa chỉ tối đa 500 ký tự'),
    storeManagerUserId: z.number().nullable(),
    obmUserId: z.number().nullable(),
    latitude: z.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').nullable(),
    longitude: z.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').nullable(),
    checkinRadiusM: z.number().int('Bán kính là số nguyên').min(10, 'Bán kính tối thiểu 10 m').max(5000, 'Bán kính tối đa 5000 m').nullable(),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.companyId === null) ctx.addIssue({ code: 'custom', path: ['companyId'], message: 'Vui lòng chọn công ty' })
    if (v.unitType !== 'RESTAURANT') return
    // Toạ độ chưa bắt buộc; nếu nhập thì phải đủ cả hai.
    if (v.latitude === null && v.longitude !== null) ctx.addIssue({ code: 'custom', path: ['latitude'], message: 'Nhập thêm vĩ độ hoặc xoá kinh độ' })
    if (v.longitude === null && v.latitude !== null) ctx.addIssue({ code: 'custom', path: ['longitude'], message: 'Nhập thêm kinh độ hoặc xoá vĩ độ' })
  })
export type OrgUnitFormValues = z.infer<typeof orgUnitSchema>
