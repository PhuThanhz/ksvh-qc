import { SearchOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons'
import { Avatar, Empty, Input, Spin } from 'antd'
import { useMemo, useState } from 'react'
import type { PlanAssignmentRequest } from '@/features/inspections/inspection.types'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ROLES } from '@/permissions'

export interface PlanInspectorPanelProps {
  assignments: readonly PlanAssignmentRequest[]
  /** Chuyên viên đang chọn: nhà hàng thêm mới sẽ giao cho người này. */
  selectedId?: number
  onSelect: (id: number | undefined) => void
  /** Số ngày bị trùng lịch của từng chuyên viên trong kỳ. */
  conflictDays: ReadonlyMap<number, number>
  /** Số lịch đã có ở kế hoạch khác trong kỳ. */
  otherLoad: ReadonlyMap<number, number>
}

/** Bỏ phần chức danh trong ngoặc: "Lê Hoàng Bảo (Chuyên viên …)" → "Lê Hoàng Bảo". */
const cleanName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '').trim()

/** Chữ cái đầu của họ và tên: "Lê Hoàng Bảo" → "LB". */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** Bảng màu avatar dịu, mỗi chuyên viên cố định một màu theo id. */
const AVATAR_TONES = ['blue', 'teal', 'violet', 'amber', 'rose', 'green'] as const

/** Cột trái: danh sách chuyên viên KSVH và số nhà hàng mỗi người đang được giao trong kế hoạch này. */
export function PlanInspectorPanel({ assignments, selectedId, onSelect, conflictDays, otherLoad }: PlanInspectorPanelProps) {
  const inspectors = useUsers({ page: 0, size: 200, active: true, role: ROLES.KSVH_INSPECTOR })
  const employees = useEmployees({ page: 0, size: 500, active: true })
  const [keyword, setKeyword] = useState('')

  /** Hồ sơ nhân viên theo userId: lấy họ tên chuẩn và MSNV. */
  const employeeByUser = useMemo(() => {
    const m = new Map<number, { code: string; name: string }>()
    for (const e of employees.data?.items ?? []) if (e.userId != null) m.set(e.userId, { code: e.employeeCode, name: e.fullName })
    return m
  }, [employees.data])

  const load = useMemo(() => {
    const m = new Map<number, number>()
    for (const a of assignments) if (a.inspectorId) m.set(a.inspectorId, (m.get(a.inspectorId) ?? 0) + 1)
    return m
  }, [assignments])

  const list = (inspectors.data?.items ?? [])
    .map((u) => {
      const emp = employeeByUser.get(u.id)
      return { ...u, name: emp?.name ?? cleanName(u.fullName), code: emp?.code }
    })
    .filter((u) => {
      const k = keyword.trim().toLowerCase()
      return !k || [u.name, u.username, u.code ?? ''].some((v) => v.toLowerCase().includes(k))
    })
  const unassigned = assignments.filter((a) => !a.inspectorId).length

  return (
    <aside className="plan-team">
      <div className="plan-team__head">
        <TeamOutlined />
        <span>Chuyên viên KSVH</span>
        <em>{inspectors.data?.items.length ?? 0}</em>
      </div>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên hoặc MSNV"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <p className="plan-team__tip">Tick nhà hàng ở bảng bên phải, rồi bấm một chuyên viên để giao.</p>
      <div className="plan-team__list">
        {inspectors.isLoading && <Spin style={{ margin: 24 }} />}
        {!inspectors.isLoading && list.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có chuyên viên phù hợp" />
        )}
        {list.map((u) => {
          const count = load.get(u.id) ?? 0
          const others = otherLoad.get(u.id) ?? 0
          const clash = conflictDays.get(u.id) ?? 0
          const active = selectedId === u.id
          return (
            <button
              key={u.id}
              type="button"
              className={`plan-team__item${active ? ' is-active' : ''}`}
              onClick={() => onSelect(active ? undefined : u.id)}
            >
              <Avatar size={34} className={`plan-team__avatar plan-team__avatar--${AVATAR_TONES[u.id % AVATAR_TONES.length]}`}>
                {initials(u.name)}
              </Avatar>
              <span className="plan-team__name">
                <strong>{u.name}</strong>
                <small>
                  <span className="plan-team__code">{u.code ?? u.username}</span>
                  {others > 0 && <span>· {others} lịch ở KH khác</span>}
                  {clash > 0 && <b className="plan-team__clash"><WarningOutlined /> trùng {clash} ngày</b>}
                </small>
              </span>
              <span className={`plan-team__load${count > 0 ? ' has-load' : ''}`}>
                {count > 0 ? `${count} NH` : 'Trống'}
              </span>
            </button>
          )
        })}
      </div>
      {unassigned > 0 && <div className="plan-team__warn">{unassigned} nhà hàng chưa có chuyên viên</div>}
    </aside>
  )
}
