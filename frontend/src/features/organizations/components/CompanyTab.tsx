import { Flex } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { ActiveFilter } from '@/components/data-entry/ActiveFilter'
import { AdvancedFilter, type FilterTagItem } from '@/components/data-entry/AdvancedFilter'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { CompanyDetailModal } from '@/features/organizations/components/CompanyDetailModal'
import { CompanyFormModal } from '@/features/organizations/components/CompanyFormModal'
import { CompanyTable } from '@/features/organizations/components/CompanyTable'
import { useCompanies, useDeleteCompany } from '@/features/organizations/hooks/useOrganizations'
import type { Company } from '@/features/organizations/organizations.types'
import { useListParams } from '@/hooks/useListParams'
import { getErrorMessage } from '@/lib/http'

interface CompanyFilters extends Record<string, unknown> {
  keyword?: string
  active?: boolean
}

export interface CompanyTabProps {
  createOpen?: boolean
  onCreateClose?: () => void
}

export function CompanyTab({ createOpen, onCreateClose }: CompanyTabProps = {}) {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<CompanyFilters>()
  const companies = useCompanies(params)
  const remove = useDeleteCompany()
  const confirm = useConfirm()
  const notify = useNotify()

  const [editing, setEditing] = useState<{ open: boolean; company?: Company }>({ open: false })
  const [viewing, setViewing] = useState<{ open: boolean; company?: Company }>({ open: false })

  const isFormOpen = createOpen || editing.open
  const handleCloseForm = () => {
    setEditing({ open: false })
    onCreateClose?.()
  }

  const onSearch = useCallback((keyword: string) => setFilter('keyword', keyword || undefined), [setFilter])

  const activeTags = useMemo<FilterTagItem[]>(() => {
    const tags: FilterTagItem[] = []
    if (filters.active !== undefined) {
      tags.push({
        key: 'active',
        label: `Trạng thái: ${filters.active ? 'Đang hoạt động' : 'Ngưng hoạt động'}`,
        onClose: () => setFilter('active', undefined),
      })
    }
    return tags
  }, [filters.active, setFilter])

  const onDelete = async (company: Company) => {
    const ok = await confirm({
      title: `Xoá công ty "${company.name}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    remove.mutate(company.id, {
      onSuccess: () => notify.success('Đã xoá công ty'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  return (
    <Flex vertical gap={16}>
      <AdvancedFilter
        search={{ value: filters.keyword ?? '', placeholder: 'Tìm theo mã hoặc tên công ty', onSearch }}
        activeCount={activeFilterCount}
        activeTags={activeTags}
        onReset={resetFilters}
      >
        <ActiveFilter value={filters.active} onChange={(v) => setFilter('active', v)} />
      </AdvancedFilter>

      <CompanyTable
        data={companies.data}
        loading={companies.isFetching}
        error={companies.error}
        onRetry={() => void companies.refetch()}
        params={params}
        onParamsChange={onTableChange}
        onView={(company) => setViewing({ open: true, company })}
        onEdit={(company) => setEditing({ open: true, company })}
        onDelete={onDelete}
      />
      <CompanyFormModal open={isFormOpen} company={editing.company} onClose={handleCloseForm} />
      <CompanyDetailModal open={viewing.open} company={viewing.company} onClose={() => setViewing({ open: false })} />
    </Flex>
  )
}
