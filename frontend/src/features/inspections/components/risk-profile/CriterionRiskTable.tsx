import { EyeOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { CriterionRiskProfileItem } from '@/features/inspections/risk-profile.types'
import { formatDate } from '@/utils/format-date'

export interface CriterionRiskTableProps {
  criteria: CriterionRiskProfileItem[]
  isLoading?: boolean
  resetPeriodMonths?: number
  onSelectCriterion: (criterion: CriterionRiskProfileItem) => void
}

export function CriterionRiskTable({
  criteria,
  isLoading,
  resetPeriodMonths,
  onSelectCriterion,
}: CriterionRiskTableProps) {
  const columns: ColumnsType<CriterionRiskProfileItem> = [
    {
      title: 'Mã tiêu chí',
      dataIndex: 'criterionCode',
      key: 'criterionCode',
      width: 120,
      render: (v) => <b>{v}</b>,
    },
    {
      title: 'Tên tiêu chí',
      dataIndex: 'criterionName',
      key: 'criterionName',
      ellipsis: true,
      render: (v, r) => (
        <div>
          <div>{v}</div>
          <div className="app-subtext">Nhóm: {r.groupName || 'Chung'}</div>
        </div>
      ),
    },
    {
      title: 'Mức ảnh hưởng',
      key: 'impact',
      width: 160,
      render: (_, r) => (
        <Flex align="center" gap={6}>
          <Tag>Gốc: Mức {r.baseImpact}</Tag>
          {r.isEscalated ? (
            <Tag color="error">▲ Hiệu lực: Mức {r.effectiveImpact}</Tag>
          ) : (
            <Tag color="success">Hiệu lực: Mức {r.effectiveImpact}</Tag>
          )}
        </Flex>
      ),
    },
    {
      title: 'Tần suất kỳ',
      dataIndex: 'frequencyInPeriod',
      key: 'frequencyInPeriod',
      width: 105,
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: v >= 3 ? '#ff4d4f' : '#fa8c16' }}>{v} lần</b> : '0'),
    },
    {
      title: 'Lần lỗi gần nhất',
      dataIndex: 'lastViolationDate',
      key: 'lastViolationDate',
      width: 130,
      render: (v?: string) => (v ? formatDate(v) : 'Chưa có lỗi'),
    },
    {
      title: 'Dự kiến hạ mức',
      key: 'reset',
      width: 210,
      render: (_, r) => {
        if (!r.isEscalated) {
          return <Tag color="default">Đang ở mức gốc</Tag>
        }
        return (
          <Tooltip title={`Đã có ${r.cleanMonthsCount}/${resetPeriodMonths ?? 6} tháng sạch liên tục`}>
            <Tag color="warning">
              Về mức {r.baseImpact} từ {formatDate(r.expectedResetDate)}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Lỗi đang mở',
      dataIndex: 'openFindingsCount',
      key: 'openFindingsCount',
      width: 110,
      align: 'right',
      render: (v: number) => (v > 0 ? <b style={{ color: '#ff4d4f' }}>{v}</b> : 0),
    },
    {
      title: 'Lịch sử',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Tooltip title="Xem lịch sử các lần vi phạm">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onSelectCriterion(r)}
            disabled={!r.occurrences?.length}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Table
      rowKey="criterionId"
      dataSource={criteria}
      columns={columns}
      loading={isLoading}
      pagination={{ pageSize: 15, showSizeChanger: true }}
      size="middle"
      scroll={{ x: 950 }}
    />
  )
}
