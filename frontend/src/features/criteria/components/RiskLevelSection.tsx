import { EditOutlined, HistoryOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { RiskLevelTag } from '@/components/data-display/RiskLevelTag'
import { TableActions } from '@/components/data-display/TableActions'
import { TableCard } from '@/components/data-display/TableCard'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { DetailModal } from '@/components/feedback/DetailModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import { RiskLevelDetailModal } from '@/features/criteria/components/RiskLevelDetailModal'
import { RiskLevelFormModal } from '@/features/criteria/components/RiskLevelFormModal'
import { RiskLevelVersionTable } from '@/features/criteria/components/RiskLevelVersionTable'
import type { RiskLevel, RiskLevelVersion } from '@/features/criteria/criteria.types'
import { useDeleteRiskLevelVersion, useRiskLevelVersions } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface RiskLevelSectionProps {
  createOpen?: boolean
  onCreateClose?: () => void
}

const EMPTY_LIST: readonly RiskLevelVersion[] = []
const fmt = (n: number) => n.toLocaleString('vi-VN')

export function RiskLevelSection({ createOpen, onCreateClose }: RiskLevelSectionProps) {
  const notify = useNotify()
  const confirm = useConfirm()
  const { can } = usePermission()
  const editable = can(PERMISSIONS.CRITERIA.MANAGE)
  const versions = useRiskLevelVersions()
  const removeVersion = useDeleteRiskLevelVersion()

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [keyword, setKeyword] = useState('')
  const [viewingLevel, setViewingLevel] = useState<RiskLevel | null>(null)
  const [detailModal, setDetailModal] = useState<RiskLevelVersion | null>(null)
  const [formModal, setFormModal] = useState<{
    open: boolean
    source: readonly RiskLevel[]
    effectiveFrom?: string
  }>({ open: false, source: [] })

  const list = versions.data ?? EMPTY_LIST
  const currentVersion = list.find((v) => v.status === 'CURRENT') ?? list[0]
  const currentLevels = useMemo(() => currentVersion?.levels ?? [], [currentVersion])

  const activeForm = formModal.open
    ? formModal
    : createOpen
      ? {
          open: true,
          source: currentLevels,
          effectiveFrom: currentVersion?.status === 'SCHEDULED' ? currentVersion.effectiveFrom : undefined,
        }
      : { open: false, source: [], effectiveFrom: undefined }

  const handleCloseForm = () => {
    setFormModal({ open: false, source: [] })
    onCreateClose?.()
  }

  const handleEditVersion = (v: RiskLevelVersion) => {
    setFormModal({
      open: true,
      source: v.levels,
      effectiveFrom: v.status === 'SCHEDULED' ? v.effectiveFrom : undefined,
    })
  }

  const handleDeleteVersion = async (v: RiskLevelVersion) => {
    if (v.status !== 'SCHEDULED') {
      notify.warning(
        'Chỉ có thể xoá phiên bản ở trạng thái "Sắp áp dụng". Phiên bản đang áp dụng không thể xoá để đảm bảo tính toàn vẹn dữ liệu.',
      )
      return
    }
    const ok = await confirm({
      title: `Xoá phiên bản hiệu lực từ ${formatDate(v.effectiveFrom)}?`,
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

  const filteredLevels = useMemo(() => {
    if (!keyword.trim()) return currentLevels
    const q = keyword.trim().toLowerCase()
    return currentLevels.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        (l.action && l.action.toLowerCase().includes(q)),
    )
  }, [currentLevels, keyword])

  const filteredVersions = useMemo(() => {
    if (!keyword.trim()) return list
    const q = keyword.trim().toLowerCase()
    return list.filter(
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
  }, [list, keyword])

  if (versions.error && !versions.data) {
    return <ErrorState onRetry={() => void versions.refetch()} />
  }

  return (
    <Flex vertical gap={16}>
      <AdvancedFilter
        search={{
          value: keyword,
          placeholder: 'Tìm theo mã mức (M1, M2, M3, M4), tên mức rủi ro hoặc hành động bắt buộc...',
          onSearch: setKeyword,
        }}
        activeCount={keyword.trim() ? 1 : 0}
        onReset={() => setKeyword('')}
      >
        {currentVersion && (
          <Flex wrap gap={8} align="center">
            <span className="app-stat-chip">
              Hiệu lực từ: <strong>{formatDate(currentVersion.effectiveFrom)}</strong>
            </span>
            <span className="app-stat-chip">
              Tổng số: <strong>{currentLevels.length}</strong> mức phân loại
            </span>
          </Flex>
        )}
      </AdvancedFilter>

      {list.length > 1 && (
        <ViewTabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'current' | 'history')}
          items={[
            {
              key: 'current',
              label: 'Thang phân loại rủi ro (M1 – M4)',
              icon: <SafetyCertificateOutlined />,
              count: currentLevels.length,
            },
            {
              key: 'history',
              label: 'Lịch sử thay đổi',
              icon: <HistoryOutlined />,
              count: list.length,
            },
          ]}
        />
      )}

      {activeTab === 'current' ? (
        <TableCard>
          {currentVersion && (
            <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ borderBottom: '1px solid #eef2f6' }}>
              <Flex align="center" gap={8}>
                <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>
                  Bảng thang mức độ rủi ro & thời hạn khắc phục bắt buộc
                </Typography.Title>
                <ConfigStatusTag status={currentVersion.status} />
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Áp dụng từ <b>{formatDate(currentVersion.effectiveFrom)}</b>
                {currentVersion.updatedByName ? ` · Cập nhật bởi ${currentVersion.updatedByName}` : ''}
              </Typography.Text>
            </Flex>
          )}
          <Table<RiskLevel>
            rowKey="code"
            size="middle"
            loading={versions.isLoading}
            dataSource={[...filteredLevels]}
            pagination={false}
            scroll={{ x: 960 }}
            columns={[
              {
                title: '#',
                key: 'index',
                width: 56,
                align: 'center',
                render: (_, __, i) => i + 1,
              },
              {
                title: 'Mã mức',
                dataIndex: 'code',
                width: 110,
                render: (c: string, l) => (
                  <span style={{ cursor: 'pointer' }} onClick={() => setViewingLevel(l)}>
                    <RiskLevelTag code={c} />
                  </span>
                ),
              },
              {
                title: 'Tên mức rủi ro',
                dataIndex: 'name',
                width: 180,
                render: (name: string, l) => (
                  <span className="cell-title-link" onClick={() => setViewingLevel(l)}>
                    {name}
                  </span>
                ),
              },
              {
                title: 'Khoảng điểm vi phạm',
                key: 'range',
                width: 210,
                render: (_, l) => (
                  <Typography.Text strong>
                    {l.maxScore == null
                      ? `Từ ${fmt(l.minScore)} điểm trở lên`
                      : `Từ ${fmt(l.minScore)} đến dưới ${fmt(l.maxScore)} điểm`}
                  </Typography.Text>
                ),
              },
              {
                title: 'Thời hạn khắc phục',
                dataIndex: 'remediationDays',
                width: 160,
                render: (d: number) => (
                  <Tag color={d <= 1 ? 'error' : d <= 7 ? 'warning' : 'blue'} style={{ margin: 0 }}>
                    {d === 0 ? 'Xử lý ngay' : `Trong vòng ${d} ngày`}
                  </Tag>
                ),
              },
              {
                title: 'Hành động bắt buộc khi vi phạm',
                dataIndex: 'action',
                render: (a?: string | null) => a || <Typography.Text type="secondary">—</Typography.Text>,
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: actionColumnWidth(2),
                className: 'col-actions',
                align: 'center',
                render: (_, l) => (
                  <TableActions
                    onView={() => setViewingLevel(l)}
                    onEdit={
                      currentVersion
                        ? () => handleEditVersion(currentVersion)
                        : undefined
                    }
                    editLabel="Chỉnh sửa thang phân loại"
                    editAccess={PERMISSIONS.CRITERIA.MANAGE}
                    recordName={`mức ${l.code} (${l.name})`}
                  />
                ),
              },
            ]}
          />
        </TableCard>
      ) : (
        <RiskLevelVersionTable
          loading={versions.isLoading}
          dataSource={filteredVersions}
          onView={(v) => setDetailModal(v)}
          onEdit={(v) => handleEditVersion(v)}
          onDelete={(v) => void handleDeleteVersion(v)}
        />
      )}

      {/* Drawer xem chi tiết 1 mức rủi ro M1–M4 */}
      <DetailModal
        open={Boolean(viewingLevel)}
        title="Chi tiết mức phân loại rủi ro"
        icon={<SafetyCertificateOutlined />}
        onClose={() => setViewingLevel(null)}
        hero={
          viewingLevel
            ? {
                avatar: <SafetyCertificateOutlined />,
                eyebrow: 'Mức độ rủi ro',
                title: `${viewingLevel.code} – ${viewingLevel.name}`,
                status: <RiskLevelTag code={viewingLevel.code} />,
                description: viewingLevel.action || undefined,
              }
            : undefined
        }
        audit={
          currentVersion
            ? {
                updatedBy: currentVersion.updatedByName,
                updatedAt: currentVersion.updatedAt ? formatDateTime(currentVersion.updatedAt) : undefined,
              }
            : undefined
        }
        fields={
          viewingLevel
            ? [
                { label: 'Mã mức rủi ro', value: <RiskLevelTag code={viewingLevel.code} /> },
                { label: 'Tên mức rủi ro', value: <b>{viewingLevel.name}</b> },
                {
                  label: 'Khoảng điểm vi phạm',
                  value:
                    viewingLevel.maxScore == null
                      ? `Từ ${fmt(viewingLevel.minScore)} điểm trở lên`
                      : `Từ ${fmt(viewingLevel.minScore)} đến dưới ${fmt(viewingLevel.maxScore)} điểm`,
                },
                {
                  label: 'Thời hạn khắc phục bắt buộc',
                  value: (
                    <b>
                      {viewingLevel.remediationDays === 0
                        ? 'Xử lý ngay'
                        : `${viewingLevel.remediationDays} ngày`}
                    </b>
                  ),
                },
                {
                  label: 'Hành động bắt buộc khi vi phạm',
                  span: 2,
                  value: viewingLevel.action || '—',
                },
              ]
            : []
        }
        extraFooter={
          editable &&
          currentVersion && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setViewingLevel(null)
                handleEditVersion(currentVersion)
              }}
            >
              Cập nhật thang phân loại
            </Button>
          )
        }
      />

      <RiskLevelDetailModal
        open={Boolean(detailModal)}
        version={detailModal}
        editable={editable}
        onClose={() => setDetailModal(null)}
        onEdit={(v) => handleEditVersion(v)}
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
