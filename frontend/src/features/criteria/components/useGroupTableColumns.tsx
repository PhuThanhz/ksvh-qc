import {
  RightOutlined,
} from '@ant-design/icons'
import { Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TableActions } from '@/components/data-display/TableActions'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

interface ColumnHandlers {
  onEdit: (group: CriterionGroup) => void
  onAddCriterion: (group: CriterionGroup) => void
  onViewCriteria: (group: CriterionGroup) => void
  onDelete: (group: CriterionGroup) => void
}

export function useGroupTableColumns({
  onEdit,
  onAddCriterion,
  onViewCriteria,
  onDelete,
}: ColumnHandlers): ColumnsType<CriterionGroup> {
  return [
    {
      title: '#',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã nhóm',
      className: 'col-code',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      width: 140,
      render: (code: string) => <span className="code-tag--blue">{code}</span>,
    },
    {
      title: 'Tên nhóm tiêu chí',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 280,
      render: (name: string, g: CriterionGroup) => (
        <Tooltip title="Xem chi tiết nhóm và danh sách tiêu chí kiểm soát">
          <span
            className="cell-title-link"
            onClick={() => onViewCriteria(g)}
            style={{
              fontSize: 13.5,
              textDecoration: g.active ? 'none' : 'line-through',
            }}
          >
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Công ty áp dụng',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (comp?: string | null) =>
        comp ? <Tag>{comp}</Tag> : <Tag color="default">Dùng chung toàn hệ thống</Tag>,
    },
    {
      title: 'Số lượng tiêu chí',
      dataIndex: 'criterionCount',
      key: 'criterionCount',
      width: 150,
      render: (count: number, g: CriterionGroup) => (
        <Tag
          onClick={() => onViewCriteria(g)}
          style={{
            cursor: 'pointer',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{count} tiêu chí</span>
          <RightOutlined style={{ fontSize: 9, opacity: 0.7 }} />
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 160,
      render: (a: boolean) => <StatusBadge status={a ? 'active' : 'inactive'} meta={ACTIVE_META} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: actionColumnWidth(4),
      // Ghim mép phải bằng CSS sticky (.col-actions), không làm đổi bố cục các cột khác.
      className: 'col-actions',
      align: 'center' as const,
      render: (_, g: CriterionGroup) => (
        <TableActions
          recordName={g.name}
          onView={() => onViewCriteria(g)}
          viewLabel="Xem chi tiết nhóm tiêu chí"
          onAdd={() => onAddCriterion(g)}
          addLabel="Thêm tiêu chí vào nhóm"
          addAccess={PERMISSIONS.CRITERIA.MANAGE}
          onEdit={() => onEdit(g)}
          editLabel="Chỉnh sửa nhóm tiêu chí"
          editAccess={PERMISSIONS.CRITERIA.MANAGE}
          onDelete={() => onDelete(g)}
          deleteLabel="Xoá nhóm tiêu chí"
          deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
        />
      ),
    },
  ]
}
