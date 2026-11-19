import type { components } from '@/types/api.generated'

type Schemas = components['schemas']

export type Role = Schemas['RoleResponse']
export type RolePayload = Schemas['RoleRequest']
export type PermissionInfo = Schemas['PermissionResponse']

/** Nhãn tiếng Việt của module (phần trước dấu ":" trong mã permission). */
export const MODULE_LABEL: Record<string, string> = {
  user: 'Tài khoản người dùng',
  role: 'Vai trò người dùng',
  system: 'Quản trị hệ thống',
  employee: 'Hồ sơ nhân sự',
  organization: 'Đơn vị & Cơ sở vận hành',
  criteria: 'Tiêu chuẩn & Cấu hình rủi ro',
  plan: 'Kế hoạch kiểm soát vận hành',
  inspection: 'Biên bản kiểm tra KSVH',
  finding: 'Khắc phục điểm không phù hợp',
  report: 'Báo cáo & Phân tích kiểm soát',
  media: 'Hồ sơ minh chứng (Ảnh/Video)',
}

export const moduleLabel = (module: string) => MODULE_LABEL[module] ?? module

/** Gom permission theo module, giữ thứ tự server trả về (thứ tự khai báo trong code). */
export function groupByModule(perms: readonly PermissionInfo[]): { module: string; items: PermissionInfo[] }[] {
  const groups = new Map<string, PermissionInfo[]>()
  for (const p of perms) {
    const list = groups.get(p.module) ?? []
    list.push(p)
    groups.set(p.module, list)
  }
  return [...groups].map(([module, items]) => ({ module, items }))
}
