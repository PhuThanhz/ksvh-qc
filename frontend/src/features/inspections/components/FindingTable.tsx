import {
  AuditOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  FormOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { Button, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import type { FindingResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  data?: FindingResponse[]
  loading?: boolean
  currentPage?: number
  pageSize?: number
  onAction: (finding: FindingResponse, action: FindingActionType) => void
}

const STATUS_TAG: Record<FindingStatus, { color: string; label: string }> = {
  OPEN: { color: 'warning', label: 'Chờ phản hồi' },
  CONFIRMED: { color: 'blue', label: 'Đã xác nhận' },
  APPEALED: { color: 'purple', label: 'Đang khiếu nại' },
  REMEDIATING: { color: 'orange', label: 'Đang khắc phục' },
  PENDING_VERIFICATION: { color: 'cyan', label: 'Chờ nghiệm thu' },
  CLOSED: { color: 'success', label: 'Đã đóng' },
  DISMISSED: { color: 'default', label: 'Đã huỷ bỏ' },
}

export function FindingTable({
  data,
  loading,
  currentPage = 0,
  pageSize = 20,
  onAction,
}: Props) {
  const columns: ColumnsType<FindingResponse> = [
    {
      title: '#',
      key: 'idx',
      width: 50,
      align: 'center',
      render: (_, __, i) => currentPage * pageSize + i + 1,
    },
    {
      title: 'Nhà hàng & Phiếu',
      key: 'res',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.restaurantName}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>Phiếu: {r.inspectionCode}</div>
        </div>
      ),
    },
    {
      title: 'Tiêu chí vi phạm',
      key: 'crit',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.criterionName}</div>
          <div style={{ fontSize: 12, color: '#cf1322' }}>{r.description}</div>
          {r.appealReason && (
            <div style={{ fontSize: 12, color: '#722ed1', marginTop: 2 }}>Khiếu nại: {r.appealReason}</div>
          )}
          {r.remediationPlan && (
            <div style={{ fontSize: 12, color: '#d46b08', marginTop: 2 }}>KH khắc phục: {r.remediationPlan}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mức rủi ro',
      key: 'risk',
      width: 140,
      render: (_, r) => (
        <div>
          <Tag color={r.riskLevelCode === 'M4' ? 'error' : r.riskLevelCode === 'M3' ? 'warning' : 'blue'}>
            {r.riskLevelCode} - {r.riskLevelName}
          </Tag>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            Điểm: {r.calculatedScore} (lặp lại {r.violationCount} lần)
          </div>
        </div>
      ),
    },
    {
      title: 'Hạn khắc phục',
      dataIndex: 'deadlineDate',
      key: 'deadline',
      width: 115,
      render: (v) => formatDate(v),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (st: FindingStatus) => <Tag color={STATUS_TAG[st]?.color}>{STATUS_TAG[st]?.label}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          {r.status === 'OPEN' && (
            <>
              <Tooltip title="Xác nhận nhận lỗi">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => onAction(r, 'CONFIRM')}
                />
              </Tooltip>
              <Tooltip title="Khiếu nại">
                <Button
                  type="text"
                  icon={<RollbackOutlined style={{ color: '#722ed1' }} />}
                  onClick={() => onAction(r, 'APPEAL')}
                />
              </Tooltip>
            </>
          )}

          {r.status === 'APPEALED' && (
            <Tooltip title="Thẩm định khiếu nại">
              <Button
                type="text"
                icon={<AuditOutlined style={{ color: '#1677ff' }} />}
                onClick={() => onAction(r, 'CONCLUDE_APPEAL')}
              />
            </Tooltip>
          )}

          {r.status === 'CONFIRMED' && (
            <Tooltip title="Lập kế hoạch khắc phục">
              <Button
                type="text"
                icon={<FormOutlined style={{ color: '#fa8c16' }} />}
                onClick={() => onAction(r, 'REMEDIATION_PLAN')}
              />
            </Tooltip>
          )}

          {r.status === 'REMEDIATING' && (
            <Tooltip title="Nộp bằng chứng khắc phục">
              <Button
                type="text"
                icon={<FileDoneOutlined style={{ color: '#13c2c2' }} />}
                onClick={() => onAction(r, 'SUBMIT_REMEDIATION')}
              />
            </Tooltip>
          )}

          {r.status === 'PENDING_VERIFICATION' && (
            <Tooltip title="Nghiệm thu đóng lỗi">
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => onAction(r, 'VERIFY')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="middle"
    />
  )
}
