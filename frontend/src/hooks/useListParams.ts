import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/constants/app.constants'
import type { PageParams } from '@/types/common.types'

type FilterRecord = Record<string, unknown>

function compactFilters<F extends FilterRecord>(filters: F): Partial<F> {
  const result: Partial<F> = {}
  for (const key of Object.keys(filters) as (keyof F)[]) {
    const v = filters[key]
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    result[key] = v
  }
  return result
}

/**
 * Quản lý tham số phân trang, sắp xếp và bộ lọc cho API danh sách.
 * Tự động đưa page về 0 khi bộ lọc thay đổi và giữ nguyên bộ lọc khi đổi trang/sắp xếp.
 */
export function useListParams<F extends FilterRecord>(initialFilters?: F, initialSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState<PageParams>({ page: 0, size: initialSize })
  const [filters, setFiltersState] = useState<Partial<F>>(() =>
    initialFilters ? compactFilters(initialFilters) : {},
  )

  const params = useMemo(
    () => ({ ...page, ...filters }) as PageParams & Partial<F>,
    [page, filters],
  )

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K] | undefined) => {
    setFiltersState((prev) => {
      const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
      const current = prev[key]
      if (empty && current === undefined) return prev
      if (!empty && current === value) return prev
      const next = { ...prev }
      if (empty) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
    setPage((p) => (p.page === 0 ? p : { ...p, page: 0 }))
  }, [])

  const setFilters = useCallback((patch: Partial<F>) => {
    setFiltersState((prev) => compactFilters({ ...prev, ...patch } as F))
    setPage((p) => (p.page === 0 ? p : { ...p, page: 0 }))
  }, [])

  const onTableChange = useCallback((next: PageParams) => {
    setPage(next)
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters ? compactFilters(initialFilters) : {})
    setPage((p) => (p.page === 0 ? p : { ...p, page: 0 }))
  }, [initialFilters])

  const activeFilterCount = Object.keys(filters).length

  return {
    params,
    filters,
    setFilter,
    setFilters,
    onTableChange,
    resetFilters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
  }
}
