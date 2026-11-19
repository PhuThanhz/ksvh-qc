import { Flex } from 'antd'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { ActiveFilter } from '@/components/data-entry/ActiveFilter'
import { AdvancedFilter, type FilterTagItem } from '@/components/data-entry/AdvancedFilter'
import { FilterSelect } from '@/components/data-entry/FilterSelect'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { OrgUnitDetailModal } from '@/features/organizations/components/OrgUnitDetailModal'
import { OrgUnitFormModal } from '@/features/organizations/components/OrgUnitFormModal'
import { OrgUnitTable } from '@/features/organizations/components/OrgUnitTable'
import { useCompanies, useDeleteOrgUnit, useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import {
  ORG_UNIT_TYPE_LABEL,
  type OrgUnit,
  type OrgUnitType,
} from '@/features/organizations/organizations.types'
import { useListParams } from '@/hooks/useListParams'
import { getErrorMessage } from '@/lib/http'

export interface OrgUnitTabProps {
  fixedUnitType?: OrgUnitType
  createOpen?: boolean
  onCreateClose?: () => void
  /** Thanh chuyển tab (Nhà hàng / Phòng ban), hiển thị giữa bộ lọc và bảng. */
  tabs?: ReactNode
}

interface OrgUnitFilters extends Record<string, unknown> {
  keyword?: string
  companyId?: number
  unitType?: OrgUnitType
  active?: boolean
}

const COMPANY_FILTER_SIZE = 100
const TYPE_OPTIONS = (Object.keys(ORG_UNIT_TYPE_LABEL) as OrgUnitType[]).map((t) => ({
  value: t,
  label: ORG_UNIT_TYPE_LABEL[t],
}))

export function OrgUnitTab({ fixedUnitType, createOpen, onCreateClose, tabs }: OrgUnitTabProps = {}) {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<OrgUnitFilters>()
  const queryParams = useMemo(
    () => ({
      ...params,
      ...(fixedUnitType ? { unitType: fixedUnitType } : {}),
    }),
    [params, fixedUnitType],
  )
  const units = useOrgUnits(queryParams)
  const companies = useCompanies({ page: 0, size: COMPANY_FILTER_SIZE })
  const remove = useDeleteOrgUnit()
  const confirm = useConfirm()
  const notify = useNotify()

  const [editing, setEditing] = useState<{ open: boolean; unit?: OrgUnit }>({ open: false })
  const [viewing, setViewing] = useState<{ open: boolean; unit?: OrgUnit }>({ open: false })

  const isFormOpen = createOpen || editing.open
  const handleCloseForm = () => {
    setEditing({ open: false })
    onCreateClose?.()
  }

  const onSearch = useCallback((keyword: string) => setFilter('keyword', keyword || undefined), [setFilter])

  const itemTypeLabel = fixedUnitType === 'RESTAURANT' ? 'nhà hàng' : fixedUnitType === 'DEPARTMENT' ? 'phòng ban' : 'đơn vị'

  const searchPlaceholder =
    fixedUnitType === 'RESTAURANT'
      ? 'Tìm theo mã, tên, địa chỉ nhà hàng'
      : fixedUnitType === 'DEPARTMENT'
        ? 'Tìm theo mã, tên phòng ban'
        : 'Tìm theo mã, tên, địa chỉ'


  const activeTags = useMemo<FilterTagItem[]>(() => {
    const tags: FilterTagItem[] = []
    if (filters.companyId) {
      const c = (companies.data?.items ?? []).find((item) => item.id === filters.companyId)
      tags.push({
        key: 'companyId',
        label: `Công ty: ${c?.name ?? filters.companyId}`,
        onClose: () => setFilter('companyId', undefined),
      })
    }
    if (filters.active !== undefined) {
      tags.push({
        key: 'active',
        label: `Trạng thái: ${filters.active ? 'Đang hoạt động' : 'Ngưng hoạt động'}`,
        onClose: () => setFilter('active', undefined),
      })
    }
    if (!fixedUnitType && filters.unitType) {
      tags.push({
        key: 'unitType',
        label: `Loại: ${ORG_UNIT_TYPE_LABEL[filters.unitType]}`,
        onClose: () => setFilter('unitType', undefined),
      })
    }
    return tags
  }, [companies.data?.items, filters, fixedUnitType, setFilter])

  const onDelete = async (unit: OrgUnit) => {
    const ok = await confirm({
      title: `Xoá ${itemTypeLabel} "${unit.name}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    remove.mutate(unit.id, {
      onSuccess: () => notify.success(`Đã xoá ${itemTypeLabel}`),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  return (
    <Flex vertical gap={16}>
      <AdvancedFilter
        search={{ value: filters.keyword ?? '', placeholder: searchPlaceholder, onSearch }}
        activeCount={activeFilterCount}
        activeTags={activeTags}
        onReset={resetFilters}
      >
        <FilterSelect<number>
          placeholder="Công ty"
          width={200}
          value={filters.companyId}
          showSearch={{ optionFilterProp: 'label' }}
          options={(companies.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
          onChange={(v) => setFilter('companyId', v)}
        />
        {!fixedUnitType && (
          <FilterSelect<OrgUnitType>
            placeholder="Loại đơn vị"
            width={150}
            value={filters.unitType}
            options={TYPE_OPTIONS}
            onChange={(v) => setFilter('unitType', v)}
          />
        )}
        <ActiveFilter value={filters.active} onChange={(v) => setFilter('active', v)} />
      </AdvancedFilter>

      {tabs}
      <OrgUnitTable
        data={units.data}
        loading={units.isFetching}
        error={units.error}
        onRetry={() => void units.refetch()}
        params={params}
        onParamsChange={onTableChange}
        onView={(unit) => setViewing({ open: true, unit })}
        onEdit={(unit) => setEditing({ open: true, unit })}
        onDelete={onDelete}
        onFilterType={(t) => setFilter('unitType', t)}
        fixedUnitType={fixedUnitType}
      />
      <OrgUnitFormModal
        open={isFormOpen}
        unit={editing.unit}
        fixedUnitType={fixedUnitType}
        onClose={handleCloseForm}
      />
      <OrgUnitDetailModal
        open={viewing.open}
        unit={viewing.unit}
        fixedUnitType={fixedUnitType}
        onClose={() => setViewing({ open: false })}
        onEdit={(unit) => {
          setViewing({ open: false })
          setEditing({ open: true, unit })
        }}
      />
    </Flex>
  )
}
