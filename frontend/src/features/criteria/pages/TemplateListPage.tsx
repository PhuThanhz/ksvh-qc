import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Select, Space } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { AdvancedFilter, type FilterTagItem } from '@/components/data-entry/AdvancedFilter'
import { ActiveFilter } from '@/components/data-entry/ActiveFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { TemplateDetailModal } from '@/features/criteria/components/TemplateDetailModal'
import { TemplateFormModal } from '@/features/criteria/components/TemplateFormModal'
import { TemplateTable } from '@/features/criteria/components/TemplateTable'
import type { Template } from '@/features/criteria/criteria.types'
import { useDeleteTemplate, useTemplates } from '@/features/criteria/hooks/useTemplates'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { useConfirm } from '@/hooks/useConfirm'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { TemplateExcelActions } from '@/features/criteria/components/TemplateExcelActions'

interface Filters extends Record<string, unknown> {
  keyword?: string
  companyId?: number
  active?: boolean
}

/** Danh mục 6: mẫu phiếu chấm theo loại nhà hàng / loại kiểm tra. */
export function TemplateListPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<Filters>()
  const templates = useTemplates(params)
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const remove = useDeleteTemplate()
  const confirm = useConfirm()
  const notify = useNotify()

  const [modal, setModal] = useState<{ open: boolean; id?: number }>({ open: false })
  const [viewing, setViewing] = useState<Template>()

  const onSearch = useCallback((keyword: string) => setFilter('keyword', keyword || undefined), [setFilter])

  const onDelete = useCallback(
    async (t: Template) => {
      const ok = await confirm({
        title: 'Xoá mẫu phiếu kiểm tra',
        content: `Bạn có chắc chắn muốn xoá mẫu phiếu "${t.name}" (${t.code})? Hành động này không thể hoàn tác.`,
        okText: 'Xoá',
        danger: true,
      })
      if (!ok) return
      try {
        await remove.mutateAsync(t.id)
        notify.success(`Đã xoá mẫu phiếu ${t.name}`)
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? 'Không thể xoá mẫu phiếu'
        notify.error(msg)
      }
    },
    [confirm, notify, remove],
  )

  const activeTags = useMemo<FilterTagItem[]>(() => {
    const tags: FilterTagItem[] = []
    if (filters.keyword) {
      tags.push({ key: 'keyword', label: `Từ khoá: ${filters.keyword}`, onClose: () => setFilter('keyword', undefined) })
    }
    if (filters.companyId) {
      const found = companies.data?.items.find((c) => c.id === filters.companyId)
      tags.push({
        key: 'companyId',
        label: `Công ty: ${found ? found.name : filters.companyId}`,
        onClose: () => setFilter('companyId', undefined),
      })
    }
    if (filters.active !== undefined) {
      tags.push({
        key: 'active',
        label: filters.active ? 'Đang dùng' : 'Ngưng',
        onClose: () => setFilter('active', undefined),
      })
    }
    return tags
  }, [companies.data?.items, filters, setFilter])

  return (
    <PageContainer
      title="Mẫu phiếu kiểm tra"
      subtitle="Bộ tiêu chuẩn đánh giá áp dụng theo từng hình thức kiểm soát và mô hình vận hành"
      extra={
        <Space size={8}>
          <TemplateExcelActions />
          <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true })}>
              Tạo mẫu phiếu kiểm tra
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <Flex vertical gap={16}>
        <AdvancedFilter
          search={{
            value: filters.keyword ?? '',
            placeholder: 'Tìm theo mã, tên, loại nhà hàng, kiểm tra...',
            maxWidth: 480,
            onSearch,
          }}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          activeTags={activeTags}
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Lọc theo công ty"
            style={{ width: 240 }}
            value={filters.companyId}
            onChange={(v) => setFilter('companyId', v)}
            options={companies.data?.items.map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))}
            loading={companies.isLoading}
          />
          <ActiveFilter
            value={filters.active}
            onChange={(v) => setFilter('active', v)}
            activeLabel="Đang dùng"
            inactiveLabel="Ngưng"
          />
        </AdvancedFilter>
        <TemplateTable
          data={templates.data}
          loading={templates.isFetching}
          error={templates.error}
          onRetry={() => void templates.refetch()}
          params={params}
          onParamsChange={onTableChange}
          onView={setViewing}
          onEdit={(t) => setModal({ open: true, id: t.id })}
          onDelete={onDelete}
        />
      </Flex>
      <TemplateFormModal open={modal.open} templateId={modal.id} onClose={() => setModal({ open: false })} />
      <TemplateDetailModal
        open={Boolean(viewing)}
        template={viewing}
        onClose={() => setViewing(undefined)}
        onEdit={(t) => {
          setViewing(undefined)
          setModal({ open: true, id: t.id })
        }}
      />
    </PageContainer>
  )
}
