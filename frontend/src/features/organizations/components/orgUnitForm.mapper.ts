import { DEFAULT_CHECKIN_RADIUS_M } from '@/constants/app.constants'
import type { OrgUnit, OrgUnitPayload } from '@/features/organizations/organizations.types'
import type { OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'

/** Chuyển đổi dữ liệu giữa form Thêm/Sửa đơn vị và API. */
export const EMPTY_ORG_UNIT: OrgUnitFormValues = {
  companyId: null,
  unitType: 'RESTAURANT',
  code: '',
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  checkinRadiusM: DEFAULT_CHECKIN_RADIUS_M,
  active: true,
  escalationThreshold: null,
  escalationResetMonths: null,
  escalationStep: null,
}

export function toOrgUnitFormValues(u: OrgUnit): OrgUnitFormValues {
  return {
    companyId: u.companyId,
    unitType: u.unitType,
    code: u.code,
    name: u.name,
    address: u.address ?? '',
    latitude: u.latitude,
    longitude: u.longitude,
    checkinRadiusM: u.checkinRadiusM ?? DEFAULT_CHECKIN_RADIUS_M,
    active: u.active,
    escalationThreshold: u.escalationThreshold ?? null,
    escalationResetMonths: u.escalationResetMonths ?? null,
    escalationStep: u.escalationStep ?? null,
  }
}

/** companyId đã được schema bảo đảm khác null. Trường trống gửi undefined; phòng ban: server tự bỏ trường của nhà hàng. */
export function toOrgUnitPayload(v: OrgUnitFormValues): OrgUnitPayload {
  return {
    companyId: v.companyId ?? 0,
    unitType: v.unitType,
    code: v.code,
    name: v.name,
    address: v.address || undefined,
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    checkinRadiusM: v.checkinRadiusM ?? undefined,
    active: v.active,
    escalationThreshold: v.escalationThreshold ?? undefined,
    escalationResetMonths: v.escalationResetMonths ?? undefined,
    escalationStep: v.escalationStep ?? undefined,
  }
}
