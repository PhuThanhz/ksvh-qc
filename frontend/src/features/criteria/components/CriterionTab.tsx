import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { ActiveFilter } from '@/components/data-entry/ActiveFilter'
import { AdvancedFilter, type FilterTagItem } from '@/components/data-entry/AdvancedFilter'
import { FilterSelect } from '@/components/data-entry/FilterSelect'
import { CriterionDetailModal } from '@/features/criteria/components/CriterionDetailModal'
import { CriterionTable } from '@/features/criteria/components/CriterionTable'
import type { Criterion } from '@/features/criteria/criteria.types'
import { useCriteriaList, useCriterionGroups, useDeleteCriterion } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { useConfirm } from '@/hooks/useConfirm'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

interface Filters extends Record<string, unknown> {
  keyword?: string
  groupId?: number
  templateId?: number
  assignedToTemplate?: boolean
  active?: boolean
}

type AssignedStatus = 'assigned' | 'unassigned'
const ASSIGNED_OPTIONS: { value: AssignedStatus; label: string }[] = [
  { value: 'assigned', label: 'Đã gán vào mẫu' },
  { value: 'unassigned', label: 'Chưa gán mẫu nào' },
]

export interface CriterionTabProps {
  initialGroupId?: number
  onCreateCriterion: (defaultGroupId?: number) => void
  onEditCriterion: (criterion: Criterion) => void
}

export function CriterionTab({ initialGroupId, onCreateCriterion, onEditCriterion }: CriterionTabProps) {
  const groups = useCriterionGroups()
  const templates = useTemplates({ page: 0, size: 100 })
  const defaultFilters = useMemo(() => (initialGroupId ? { groupId: initialGroupId } : undefined), [initialGroupId])
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<Filters>(defaultFilters)
  const criteria = useCriteriaList(params)
  const remove = useDeleteCriterion()
  const confirm = useConfirm()
  const notify = useNotify()

  const [viewingCriterion, setViewingCriterion] = useState<Criterion>()

  const onSearch = useCallback((keyword: string) => setFilter('keyword', keyword || undefined), [setFilter])

  const onDeleteCriterion = useCallback(
    async (c: Criterion) => {
      const ok = await confirm({
        title: 'Xoá tiêu chí',
        content: `Bạn có chắc chắn muốn xoá tiêu chí "${c.name}" (${c.code})? Hành động này không thể hoàn tác.`,
        okText: 'Xoá',
        danger: true,
      })
      if (!ok) return
      try {
        await remove.mutateAsync(c.id)
        notify.success(`Đã xoá tiêu chí ${c.name}`)
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? 'Không thể xoá tiêu chí'
        notify.error(msg)
      }
    },
    [confirm, notify, remove],
  )


  const activeTags = useMemo<FilterTagItem[]>(() => {
    const tags: FilterTagItem[] = []
    if (filters.keyword) tags.push({ key: 'keyword', label: `Từ khoá: ${filters.keyword}`, onClose: () => setFilter('keyword', undefined) })
    if (filters.groupId) {
      const gName = (groups.data ?? []).find((g) => g.id === filters.groupId)?.name ?? filters.groupId
      tags.push({ key: 'groupId', label: `Nhóm: ${gName}`, onClose: () => setFilter('groupId', undefined) })
    }
    if (filters.templateId) {
      const tItem = (templates.data?.items ?? []).find((t) => t.id === filters.templateId)
      tags.push({ key: 'templateId', label: `Mẫu: ${tItem?.code ?? filters.templateId}`, onClose: () => setFilter('templateId', undefined) })
    }
    if (filters.assignedToTemplate !== undefined) {
      tags.push({ key: 'assignedToTemplate', label: filters.assignedToTemplate ? 'Đã gán mẫu' : 'Chưa gán mẫu', onClose: () => setFilter('assignedToTemplate', undefined) })
    }
    if (filters.active !== undefined) {
      tags.push({ key: 'active', label: filters.active ? 'Đang dùng' : 'Ngưng', onClose: () => setFilter('active', undefined) })
    }
    return tags
  }, [filters, groups.data, setFilter, templates.data?.items])

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        <AdvancedFilter
          search={{ value: filters.keyword ?? '', placeholder: 'Tìm theo mã hoặc tên tiêu chí', onSearch }}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          activeTags={activeTags}
          extra={
            <Space>
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => onCreateCriterion(filters.groupId)}
                >
                  Thêm tiêu chí
                </Button>
              </ProtectedAction>
            </Space>
          }
        >
          <FilterSelect<number>
            placeholder="Nhóm tiêu chí"
            width={220}
            value={filters.groupId}
            showSearch={{ optionFilterProp: 'label' }}
            options={(groups.data ?? []).map((g) => ({
              value: g.id,
              label: `${g.name} (${g.criterionCount}${g.companyName ? ` · ${g.companyName}` : ''})`,
            }))}
            onChange={(v) => setFilter('groupId', v)}
          />
          <FilterSelect<number>
            placeholder="Mẫu phiếu"
            width={200}
            value={filters.templateId}
            showSearch={{ optionFilterProp: 'label' }}
            options={(templates.data?.items ?? []).map((t) => ({ value: t.id, label: `${t.code} - ${t.name}` }))}
            onChange={(v) => setFilter('templateId', v)}
          />
          <FilterSelect<AssignedStatus>
            placeholder="Tình trạng gán"
            width={160}
            value={filters.assignedToTemplate === undefined ? undefined : filters.assignedToTemplate ? 'assigned' : 'unassigned'}
            options={ASSIGNED_OPTIONS}
            onChange={(v) => setFilter('assignedToTemplate', v === undefined ? undefined : v === 'assigned')}
          />
          <ActiveFilter value={filters.active} onChange={(v) => setFilter('active', v)} activeLabel="Đang dùng" inactiveLabel="Ngưng" />
        </AdvancedFilter>
        <CriterionTable
          data={criteria.data}
          loading={criteria.isFetching}
          error={criteria.error}
          onRetry={() => void criteria.refetch()}
          params={params}
          onParamsChange={onTableChange}
          onView={setViewingCriterion}
          onEdit={onEditCriterion}
          onDelete={onDeleteCriterion}
          onFilterGroup={(groupId) => setFilter('groupId', groupId)}
          onFilterTemplate={(templateId) => setFilter('templateId', templateId)}
        />
      </Flex>
      <CriterionDetailModal
        open={Boolean(viewingCriterion)}
        criterion={viewingCriterion}
        onClose={() => setViewingCriterion(undefined)}
        onEdit={(criterion) => {
          setViewingCriterion(undefined)
          onEditCriterion(criterion)
        }}
      />
    </Card>
  )
}
