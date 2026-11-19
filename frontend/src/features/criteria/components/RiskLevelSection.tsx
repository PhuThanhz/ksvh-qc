import { Badge, Flex, Select } from 'antd'
import { useMemo, useState } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { RiskLevelDetailModal } from '@/features/criteria/components/RiskLevelDetailModal'
import { RiskLevelFormModal } from '@/features/criteria/components/RiskLevelFormModal'
import { RiskLevelVersionTable } from '@/features/criteria/components/RiskLevelVersionTable'
import type { RiskLevel, RiskLevelVersion } from '@/features/criteria/criteria.types'
import { useDeleteRiskLevelVersion, useRiskLevelVersions } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate } from '@/utils/format-date'

export interface RiskLevelSectionProps {
  createOpen?: boolean
  onCreateClose?: () => void
}

const EMPTY_LIST: readonly RiskLevelVersion[] = []

export function RiskLevelSection({ createOpen, onCreateClose }: RiskLevelSectionProps) {
  const notify = useNotify()
  const confirm = useConfirm()
  const { can } = usePermission()
  const editable = can(PERMISSIONS.CRITERIA.MANAGE)
  const versions = useRiskLevelVersions()
  const removeVersion = useDeleteRiskLevelVersion()

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [detailModal, setDetailModal] = useState<RiskLevelVersion | null>(null)
  const [formModal, setFormModal] = useState<{
    open: boolean
    source: readonly RiskLevel[]
    effectiveFrom?: string
  }>({ open: false, source: [] })

  const list = versions.data ?? EMPTY_LIST
  const currentVersion = list.find((v) => v.status === 'CURRENT') ?? list[0]

  const activeForm = formModal.open
    ? formModal
    : createOpen
      ? { open: true, source: currentVersion?.levels ?? [], effectiveFrom: undefined }
      : { open: false, source: [], effectiveFrom: undefined }

  const handleCloseForm = () => {
    setFormModal({ open: false, source: [] })
    onCreateClose?.()
  }

  const handleEdit = (v: RiskLevelVersion) => {
    setFormModal({
      open: true,
      source: v.levels,
      effectiveFrom: v.status === 'SCHEDULED' ? v.effectiveFrom : undefined,
    })
  }

  const handleDelete = async (v: RiskLevelVersion) => {
    if (v.status !== 'SCHEDULED') {
      notify.warning(
        'Chỉ có thể xoá các bảng phân loại ở trạng thái "Sắp áp dụng". Bảng đang áp dụng không thể xoá để đảm bảo tính toàn vẹn dữ liệu.',
      )
      return
    }
    const ok = await confirm({
      title: `Xoá bảng phân loại hiệu lực từ ${formatDate(v.effectiveFrom)}?`,
      content: 'Hành động này sẽ huỷ bỏ lịch áp dụng của phiên bản này.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return

    removeVersion.mutate(v.effectiveFrom, {
      onSuccess: () => notify.success('Đã xoá phiên bản thành công'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  const filteredList = useMemo(() => {
    let res = list
    if (statusFilter && statusFilter !== 'ALL') {
      res = res.filter((v) => v.status === statusFilter)
    }
    const q = keyword.trim().toLowerCase()
    if (q) {
      res = res.filter(
        (v) =>
          formatDate(v.effectiveFrom).toLowerCase().includes(q) ||
          v.levels.some(
            (l) =>
              l.code.toLowerCase().includes(q) ||
              l.name.toLowerCase().includes(q) ||
              (l.action && l.action.toLowerCase().includes(q)),
          ) ||
          (v.updatedByName && v.updatedByName.toLowerCase().includes(q)),
      )
    }
    return res
  }, [list, keyword, statusFilter])

  const stats = useMemo(() => {
    const total = list.length
    const current = list.filter((v) => v.status === 'CURRENT').length
    const scheduled = list.filter((v) => v.status === 'SCHEDULED').length
    return { total, current, scheduled }
  }, [list])

  if (versions.error && !versions.data) {
    return <ErrorState onRetry={() => void versions.refetch()} />
  }

  const activeFiltersCount = (statusFilter !== 'ALL' ? 1 : 0) + (keyword.trim() ? 1 : 0)

  return (
    <Flex vertical gap={16}>
      <AdvancedFilter
        search={{
          value: keyword,
          placeholder: 'Tìm theo ngày hiệu lực, mức rủi ro (M1, M2...), người cập nhật...',
          onSearch: setKeyword,
        }}
        activeCount={activeFiltersCount}
        onReset={() => {
          setKeyword('')
          setStatusFilter('ALL')
        }}
      >
        <Select
          style={{ width: 190 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'CURRENT', label: 'Đang áp dụng' },
            { value: 'SCHEDULED', label: 'Sắp áp dụng' },
            { value: 'EXPIRED', label: 'Hết hiệu lực' },
          ]}
        />
        <Flex wrap gap={8} align="center" style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
          <span className="app-stat-chip">
            Tổng: <strong style={{ color: 'var(--app-text)' }}>{stats.total}</strong> phiên bản
          </span>
          {stats.scheduled > 0 && (
            <span className="app-stat-chip">
              <Badge status="processing" /> <strong style={{ color: 'var(--app-text)' }}>{stats.scheduled}</strong> sắp áp dụng
            </span>
          )}
        </Flex>
      </AdvancedFilter>

      <RiskLevelVersionTable
        loading={versions.isLoading}
        dataSource={filteredList}
        onView={(v) => setDetailModal(v)}
        onEdit={(v) => handleEdit(v)}
        onDelete={(v) => void handleDelete(v)}
      />

      <RiskLevelDetailModal
        open={Boolean(detailModal)}
        version={detailModal}
        editable={editable}
        onClose={() => setDetailModal(null)}
        onEdit={(v) => handleEdit(v)}
      />

      <RiskLevelFormModal
        open={activeForm.open}
        source={activeForm.source}
        effectiveFrom={activeForm.effectiveFrom}
        onClose={handleCloseForm}
        onSaved={() => {
          handleCloseForm()
          void versions.refetch()
        }}
      />
    </Flex>
  )
}
