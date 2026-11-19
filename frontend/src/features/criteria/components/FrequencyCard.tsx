import { CalendarOutlined, EditOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Select } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { DetailModal } from '@/components/feedback/DetailModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import { FrequencyFormModal } from '@/features/criteria/components/FrequencyFormModal'
import { FrequencyVersionTable } from '@/features/criteria/components/FrequencyVersionTable'
import type { FrequencyConfig } from '@/features/criteria/criteria.types'
import { useDeleteFrequency, useFrequencyConfigs } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface FrequencyCardProps {
  createOpen?: boolean
  onCreateClose?: () => void
  tabs?: ReactNode
}

/** Danh mục 8: kỳ đếm tần suất (dùng chung cả chuỗi), theo phiên bản ngày áp dụng. */
export function FrequencyCard({ createOpen = false, onCreateClose, tabs }: FrequencyCardProps) {
  const notify = useNotify()
  const confirm = useConfirm()
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.CRITERIA.MANAGE)
  const configs = useFrequencyConfigs()
  const remove = useDeleteFrequency()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewing, setViewing] = useState<FrequencyConfig | undefined>()
  const [editingSource, setEditingSource] = useState<FrequencyConfig | undefined>()

  const list = useMemo(() => configs.data ?? [], [configs.data])
  const current = list.find((c) => c.status === 'CURRENT')

  const filteredList = useMemo(() => {
    let res = list
    if (statusFilter !== 'ALL') {
      res = res.filter((c) => c.status === statusFilter)
    }
    const q = keyword.trim().toLowerCase()
    if (q) {
      res = res.filter(
        (c) =>
          `${c.periodMonths} tháng`.includes(q) ||
          formatDate(c.effectiveFrom).toLowerCase().includes(q) ||
          (c.note && c.note.toLowerCase().includes(q)) ||
          (c.createdByName && c.createdByName.toLowerCase().includes(q)),
      )
    }
    return res
  }, [list, keyword, statusFilter])

  const scheduledCount = useMemo(() => list.filter((c) => c.status === 'SCHEDULED').length, [list])
  const activeFiltersCount = (statusFilter !== 'ALL' ? 1 : 0) + (keyword.trim() ? 1 : 0)

  const onDelete = async (c: FrequencyConfig) => {
    const ok = await confirm({
      title: `Xoá phiên bản kỳ đếm áp dụng từ ${formatDate(c.effectiveFrom)}?`,
      content: 'Hành động này sẽ huỷ bỏ lịch áp dụng của phiên bản này.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    remove.mutate(c.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản thành công'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  if (configs.error && !configs.data) {
    return <ErrorState onRetry={() => void configs.refetch()} />
  }

  const formOpen = createOpen || Boolean(editingSource)
  const handleCloseForm = () => {
    setEditingSource(undefined)
    onCreateClose?.()
  }

  return (
    <Flex vertical gap={16}>
      <AdvancedFilter
        search={{
          value: keyword,
          placeholder: 'Tìm theo số tháng, ngày hiệu lực, ghi chú, người thiết lập...',
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
            { value: 'PAST', label: 'Đã thay thế' },
          ]}
        />
        <Flex wrap gap={8} align="center" style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
          <span className="app-stat-chip">
            Tổng: <strong style={{ color: 'var(--app-text)' }}>{list.length}</strong> phiên bản
          </span>
          {scheduledCount > 0 && (
            <span className="app-stat-chip">
              <Badge status="processing" /> <strong style={{ color: 'var(--app-text)' }}>{scheduledCount}</strong> sắp áp dụng
            </span>
          )}
        </Flex>
      </AdvancedFilter>

      {tabs}

      <FrequencyVersionTable
        configs={filteredList}
        loading={configs.isFetching}
        onView={(c) => setViewing(c)}
        onEdit={(c) => setEditingSource(c)}
        onDelete={(c) => void onDelete(c)}
      />

      <FrequencyFormModal
        open={formOpen}
        currentMonths={editingSource?.periodMonths ?? current?.periodMonths}
        onClose={handleCloseForm}
      />

      <DetailModal
        open={Boolean(viewing)}
        title="Chi tiết phiên bản kỳ đếm tần suất"
        icon={<CalendarOutlined />}
        onClose={() => setViewing(undefined)}
        hero={
          viewing
            ? {
                avatar: <CalendarOutlined />,
                eyebrow: 'Kỳ đếm tần suất',
                title: `${viewing.periodMonths} tháng liên tiếp`,
                status: <ConfigStatusTag status={viewing.status} />,
                description: viewing.note || 'Áp dụng tính lùi từ ngày phát sinh vi phạm trên toàn chuỗi',
              }
            : undefined
        }
        audit={
          viewing
            ? { updatedBy: viewing.createdByName ?? 'Hệ thống', updatedAt: formatDateTime(viewing.createdAt) }
            : undefined
        }
        fields={
          viewing
            ? [
                { label: 'Kỳ đếm tần suất', value: <b>{viewing.periodMonths} tháng</b> },
                { label: 'Ngày bắt đầu hiệu lực', value: <b>{formatDate(viewing.effectiveFrom)}</b> },
                { label: 'Trạng thái', value: <ConfigStatusTag status={viewing.status} /> },
                { label: 'Người thiết lập', value: viewing.createdByName ?? 'Hệ thống' },
                { label: 'Ghi chú', span: 2, value: viewing.note || '—' },
              ]
            : []
        }
        extraFooter={
          canManage &&
          viewing && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                const target = viewing
                setViewing(undefined)
                setEditingSource(target)
              }}
            >
              Tạo phiên bản mới từ bản này
            </Button>
          )
        }
      />
    </Flex>
  )
}
