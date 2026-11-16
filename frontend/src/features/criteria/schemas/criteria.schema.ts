import { z } from 'zod'

const CODE_MESSAGE = 'Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới'
const order = z.number({ error: 'Vui lòng nhập thứ tự' }).int().min(0, 'Thứ tự không được âm').max(9999, 'Thứ tự tối đa 9999')

/** Khớp CriterionGroupRequest. */
export const groupSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã nhóm').max(30, 'Mã nhóm tối đa 30 ký tự').regex(/^[A-Za-z0-9_-]+$/, CODE_MESSAGE),
  name: z.string().trim().min(1, 'Vui lòng nhập tên nhóm').max(200, 'Tên nhóm tối đa 200 ký tự'),
  companyId: z.number().nullable().optional(),
  sortOrder: order,
  active: z.boolean(),
})
export type GroupFormValues = z.infer<typeof groupSchema>

/** Khớp CriterionRequest. */
export const criterionSchema = z
  .object({
  groupId: z.number().nullable(),
  code: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã tiêu chí')
    .max(30, 'Mã tiêu chí tối đa 30 ký tự')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Mã chỉ gồm chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên tiêu chí').max(300, 'Tên tiêu chí tối đa 300 ký tự'),
  checkMethod: z.string().trim().max(4000, 'Cách kiểm tra tối đa 4000 ký tự'),
  evidenceRequired: z.string().trim().max(4000, 'Bằng chứng yêu cầu tối đa 4000 ký tự'),
  baseImpact: z.number({ error: 'Vui lòng chọn mức ảnh hưởng' }).int().min(1, 'Mức ảnh hưởng từ 1 đến 5').max(5, 'Mức ảnh hưởng từ 1 đến 5'),
  sortOrder: order,
  active: z.boolean(),
  templateIds: z.array(z.number()).optional(),
}).superRefine((v, ctx) => {
  if (v.groupId === null) ctx.addIssue({ code: 'custom', path: ['groupId'], message: 'Vui lòng chọn nhóm tiêu chí' })
})
export type CriterionFormValues = z.infer<typeof criterionSchema>

/** Khớp TemplateRequest. */
export const templateSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã mẫu phiếu').max(30, 'Mã mẫu phiếu tối đa 30 ký tự').regex(/^[A-Za-z0-9_-]+$/, CODE_MESSAGE),
  name: z.string().trim().min(1, 'Vui lòng nhập tên mẫu phiếu').max(200, 'Tên mẫu phiếu tối đa 200 ký tự'),
  companyId: z.number().nullable().optional(),
  inspectionType: z.string().trim().max(100, 'Loại kiểm tra tối đa 100 ký tự'),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự'),
  criterionIds: z.array(z.number()).min(1, 'Mẫu phiếu phải có ít nhất một tiêu chí'),
  active: z.boolean(),
})
export type TemplateFormValues = z.infer<typeof templateSchema>

/** Khớp FrequencyConfigRequest. */
export const frequencySchema = z.object({
  periodMonths: z.union([z.literal(3), z.literal(6)], { error: 'Kỳ đếm chỉ được 3 hoặc 6 tháng' }),
  effectiveFrom: z.string({ error: 'Vui lòng chọn ngày hiệu lực' }).min(1, 'Vui lòng chọn ngày hiệu lực'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
})
export type FrequencyFormValues = z.infer<typeof frequencySchema>

/** Khớp EscalationRuleRequest. */
export const escalationSchema = z.object({
  thresholdCount: z.number({ error: 'Vui lòng nhập ngưỡng' }).int().min(2, 'Ngưỡng tối thiểu 2 lần').max(50, 'Ngưỡng tối đa 50 lần'),
  stepIncrease: z.number({ error: 'Vui lòng nhập số bậc tăng' }).int().min(1, 'Số bậc tăng từ 1 đến 4').max(4, 'Số bậc tăng từ 1 đến 4'),
  maxImpact: z.number({ error: 'Vui lòng nhập mức trần' }).int().min(1, 'Mức trần từ 1 đến 5').max(5, 'Mức trần từ 1 đến 5'),
  resetPeriodMonths: z.number({ error: 'Vui lòng nhập kỳ hạ lại' }).int().min(1, 'Kỳ hạ lại từ 1 đến 24 tháng').max(24, 'Kỳ hạ lại từ 1 đến 24 tháng'),
  effectiveFrom: z.string({ error: 'Vui lòng chọn ngày hiệu lực' }).min(1, 'Vui lòng chọn ngày hiệu lực'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
})
export type EscalationFormValues = z.infer<typeof escalationSchema>

/**
 * Bảng mức rủi ro trên giao diện: chỉ nhập điểm "đến" (max); điểm "từ" của mỗi mức = "đến" của mức trước,
 * mức đầu từ 0, mức cuối không giới hạn trên. Server kiểm tra lại (RiskConfigService.validateLevels).
 */
export const riskLevelsSchema = z
  .object({
    levels: z
      .array(
        z.object({
          code: z.string().trim().regex(/^[A-Z0-9]{1,10}$/, 'Mã gồm chữ in hoa không dấu và số, tối đa 10 ký tự'),
          name: z.string().trim().min(1, 'Nhập tên mức').max(100, 'Tên tối đa 100 ký tự'),
          maxScore: z.number().positive('Điểm phải lớn hơn 0').nullable(),
          remediationDays: z
            .number({ error: 'Nhập hạn khắc phục' })
            .int()
            .min(1, 'Tối thiểu 1 ngày')
            .max(365, 'Tối đa 365 ngày'),
          action: z.string().trim().max(500, 'Tối đa 500 ký tự'),
        }),
      )
      .min(1, 'Phải có ít nhất một mức'),
  })
  .superRefine(({ levels }, ctx) => {
    let prev = 0
    levels.forEach((l, i) => {
      const last = i === levels.length - 1
      if (last) return
      if (l.maxScore === null) {
        ctx.addIssue({ code: 'custom', path: ['levels', i, 'maxScore'], message: 'Nhập điểm "đến"' })
      } else if (l.maxScore <= prev) {
        ctx.addIssue({ code: 'custom', path: ['levels', i, 'maxScore'], message: `Phải lớn hơn ${prev}` })
      } else {
        prev = l.maxScore
      }
    })
    const codes = levels.map((l) => l.code)
    codes.forEach((c, i) => {
      if (codes.indexOf(c) !== i) ctx.addIssue({ code: 'custom', path: ['levels', i, 'code'], message: 'Mã bị trùng' })
    })
  })
export type RiskLevelsFormValues = z.infer<typeof riskLevelsSchema>
