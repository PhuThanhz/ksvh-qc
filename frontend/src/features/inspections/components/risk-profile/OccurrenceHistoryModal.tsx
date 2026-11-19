import { Modal, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { CriterionRiskProfileItem, OccurrenceSummary } from '@/features/inspections/risk-profile.types'
import { formatDate } from '@/utils/format-date'

const SOURCE_TAG: Record<string, { color: string; label: string }> = {
  CONFIRMED: { color: 'default', label: 'Xác nhận vi phạm' },
  APPEAL_UPHELD: { color: 'volcano', label: 'Bác khiếu nại (Giữ lỗi)' },
  VERIFY_FAILED: { color: 'error', label: 'Nghiệm thu không đạt' },
  OVERDUE: { color: 'red', label: 'Quá hạn khắc phục (+1)' },
}

export interface OccurrenceHistoryModalProps {
  open: boolean
  criterion?: CriterionRiskProfileItem
  onClose: () => void
}

export function OccurrenceHistoryModal({ open, criterion, onClose }: OccurrenceHistoryModalProps) {
  if (!criterion) return null

  const columns: ColumnsType<OccurrenceSummary> = [
    {
      title: '#',
      key: 'idx',
      width: 50,
      align: 'center',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Ngày phát sinh',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 140,
      render: (v: string) => <b>{formatDate(v)}</b>,
    },
    {
      title: 'Nguồn phát sinh',
      dataIndex: 'source',
      key: 'source',
      render: (s: string) => {
        const meta = SOURCE_TAG[s] || { color: 'default', label: s }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: 'Mã lỗi liên quan',
      className: 'col-code',
      dataIndex: 'findingId',
      key: 'findingId',
      width: 130,
      render: (id?: number) => (id ? <span className="code-tag--blue">#{id}</span> : '—'),
    },
  ]

  return (
    <Modal
      open={open}
      title={
        <div>
          <div>Lịch sử phát sinh vi phạm tiêu chí</div>
          <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
            {criterion.criterionCode} - {criterion.criterionName}
          </Typography.Text>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <div style={{ marginTop: 12 }}>
        <Table
          rowKey={(r, i) => `${r.occurredAt}-${r.source}-${i}`}
          dataSource={criterion.occurrences}
          columns={columns}
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  )
}
