import { EditOutlined, RiseOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Select, Tag } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { DetailModal } from '@/components/feedback/DetailModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import { EscalationFormModal } from '@/features/criteria/components/EscalationFormModal'
import { EscalationVersionTable } from '@/features/criteria/components/EscalationVersionTable'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { EscalationRule } from '@/features/criteria/criteria.types'
import { useDeleteEscalation, useEscalationRules } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface EscalationCardProps {
  createOpen?: boolean
  onCreateClose?: () => void
  tabs?: ReactNode
}

/**
 * Danh mục 9: quy tắc nâng / hạ mức chung cho cả chuỗi, phiên bản theo ngày áp dụng.
 * Nhà hàng cần khác (vd fine dining) khai báo ngưỡng riêng ở Danh mục cơ sở.
 */
export function EscalationCard({ createOpen = false, onCreateClose, tabs }: EscalationCardProps) {
  const notify = useNotify()
  const confirm = useConfirm()
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.CRITERIA.MANAGE)
  const rules = useEscalationRules()
  const remove = useDeleteEscalation()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewing, setViewing] = useState<EscalationRule | undefined>()
  const [editingSource, setEditingSource] = useState<EscalationRule | undefined>()

  const list = useMemo(() => rules.data ?? [], [rules.data])
  const current = list.find((r) => r.status === 'CURRENT')

  const filteredList = useMemo(() => {
    let res = list
    if (statusFilter !== 'ALL') {
      res = res.filter((r) => r.status === statusFilter)
    }
    const q = keyword.trim().toLowerCase()
    if (q) {
      res = res.filter(
        (r) =>
          `lần ${r.thresholdCount}`.includes(q) ||
          `+${r.stepIncrease}`.includes(q) ||
          `mức ${r.maxImpact}`.includes(q) ||
          formatDate(r.effectiveFrom).toLowerCase().includes(q) ||
          (r.note && r.note.toLowerCase().includes(q)) ||
          (r.createdByName && r.createdByName.toLowerCase().includes(q)),
      )
    }
    return res
  }, [list, keyword, statusFilter])

  const scheduledCount = useMemo(() => list.filter((r) => r.status === 'SCHEDULED').length, [list])
  const activeFiltersCount = (statusFilter !== 'ALL' ? 1 : 0) + (keyword.trim() ? 1 : 0)

  const onDelete = async (r: EscalationRule) => {
    const ok = await confirm({
      title: `Xoá quy tắc nâng mức áp dụng từ ${formatDate(r.effectiveFrom)}?`,
      content: 'Hành động này sẽ huỷ bỏ lịch áp dụng của phiên bản này.',
      okText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    remove.mutate(r.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản thành công'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  if (rules.error && !rules.data) {
    return <ErrorState onRetry={() => void rules.refetch()} />
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
          placeholder: 'Tìm theo ngưỡng tái phạm, ngày hiệu lực, ghi chú, người thiết lập...',
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

      <EscalationVersionTable
        rules={filteredList}
        loading={rules.isFetching}
        onView={(r) => setViewing(r)}
        onEdit={(r) => setEditingSource(r)}
        onDelete={(r) => void onDelete(r)}
      />

      <EscalationFormModal
        open={formOpen}
        current={editingSource ?? current}
        onClose={handleCloseForm}
      />

      <DetailModal
        open={Boolean(viewing)}
        title="Chi tiết quy tắc nâng / hạ mức khi tái phạm"
        icon={<RiseOutlined />}
        onClose={() => setViewing(undefined)}
        hero={
          viewing
            ? {
                avatar: <RiseOutlined />,
                eyebrow: 'Quy tắc nâng / hạ mức rủi ro',
                title: `Từ lần vi phạm thứ ${viewing.thresholdCount} → +${viewing.stepIncrease} bậc`,
                status: <ConfigStatusTag status={viewing.status} />,
                description:
                  viewing.note ||
                  `Trần tối đa Mức ${viewing.maxImpact} · Hoàn nguyên mức gốc sau ${viewing.resetPeriodMonths} tháng liên tục không lỗi`,
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
                { label: 'Ngưỡng kích hoạt tái phạm', value: <b>Từ lần vi phạm thứ {viewing.thresholdCount}</b> },
                { label: 'Bước nâng mức', value: <Tag color="volcano">+{viewing.stepIncrease} bậc / lần</Tag> },
                { label: 'Mức trần tối đa', value: <ImpactTag value={viewing.maxImpact} /> },
                { label: 'Chu kỳ hoàn nguyên', value: <b>{viewing.resetPeriodMonths} tháng liên tục không lỗi</b> },
                { label: 'Ngày bắt đầu hiệu lực', value: <b>{formatDate(viewing.effectiveFrom)}</b> },
                { label: 'Trạng thái', value: <ConfigStatusTag status={viewing.status} /> },
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
