import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type dayjs from 'dayjs'
import { useMemo } from 'react'
import { plansApi } from '@/features/inspections/api/inspection.api'
import type { PlanAssignmentRequest } from '@/features/inspections/inspection.types'
import { inspectionKeys } from './useInspectionData'

/** Một lịch của chuyên viên trong cùng ngày: từ kế hoạch đang lập (planCode null) hoặc kế hoạch khác. */
export interface ScheduleEntry {
  restaurantId: number
  restaurantName?: string
  planCode?: string | null
}

const keyOf = (inspectorId: number, date: string) => `${inspectorId}|${date}`

/**
 * Gộp lịch trong kế hoạch đang lập với lịch đã có ở các kế hoạch khác (server trả về),
 * để cảnh báo chuyên viên có từ 2 nhà hàng trở lên trong cùng một ngày. Chỉ cảnh báo, không chặn.
 */
export function useInspectorConflicts(
  assignments: readonly PlanAssignmentRequest[],
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null | undefined,
  excludePlanId: number | undefined,
  restaurantName: (id: number) => string | undefined,
) {
  const from = dateRange?.[0]?.format('YYYY-MM-DD')
  const to = dateRange?.[1]?.format('YYYY-MM-DD')
  const external = useQuery({
    queryKey: inspectionKeys.inspectorSchedule(from, to, excludePlanId),
    queryFn: () => plansApi.inspectorSchedule({ from: from!, to: to!, excludePlanId }),
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
  })

  return useMemo(() => {
    const byKey = new Map<string, ScheduleEntry[]>()
    const push = (inspectorId: number, date: string, entry: ScheduleEntry) => {
      const k = keyOf(inspectorId, date)
      byKey.set(k, [...(byKey.get(k) ?? []), entry])
    }
    for (const s of external.data ?? []) {
      push(s.inspectorId, s.date, { restaurantId: s.restaurantId, restaurantName: s.restaurantName ?? undefined, planCode: s.planCode })
    }
    for (const a of assignments) {
      if (a.inspectorId && a.scheduledDate) {
        push(a.inspectorId, a.scheduledDate, { restaurantId: a.restaurantId, restaurantName: restaurantName(a.restaurantId), planCode: null })
      }
    }

    /** Lịch cùng ngày của chuyên viên nếu có từ 2 nhà hàng trở lên (trùng), ngược lại rỗng. */
    const conflictAt = (inspectorId?: number, date?: string): ScheduleEntry[] => {
      if (!inspectorId || !date) return []
      const list = byKey.get(keyOf(inspectorId, date)) ?? []
      return list.length > 1 ? list : []
    }
    /** Số ngày bị trùng của từng chuyên viên trong kỳ. */
    const conflictDays = new Map<number, number>()
    for (const [k, list] of byKey) {
      if (list.length < 2) continue
      const id = Number(k.split('|')[0])
      conflictDays.set(id, (conflictDays.get(id) ?? 0) + 1)
    }
    /** Số lịch ở kế hoạch khác của từng chuyên viên trong kỳ. */
    const otherLoad = new Map<number, number>()
    for (const s of external.data ?? []) otherLoad.set(s.inspectorId, (otherLoad.get(s.inspectorId) ?? 0) + 1)

    return { conflictAt, conflictDays, otherLoad }
  }, [external.data, assignments, restaurantName])
}
