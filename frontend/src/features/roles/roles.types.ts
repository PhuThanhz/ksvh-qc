import type { components } from '@/types/api.generated'

type Schemas = components['schemas']

export type Role = Schemas['RoleResponse']
export type RolePayload = Schemas['RoleRequest']
export type PermissionInfo = Schemas['PermissionResponse']

/** Nhãn tiếng Việt của module (phần trước dấu ":" trong mã permission). */
export const MODULE_LABEL: Record<string, string> = {
  user: 'Người dùng',
  role: 'Vai trò',
  system: 'Hệ thống',
  employee: 'Nhân viên',
  organization: 'Tổ chức',
  criteria: 'Tiêu chí & cấu hình rủi ro',
  plan: 'Kế hoạch kiểm tra',
  inspection: 'Phiếu chấm',
  finding: 'Lỗi, khiếu nại & khắc phục',
  report: 'Báo cáo',
  media: 'Ảnh / video',
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
