import {
  AppstoreAddOutlined,
  FolderOpenOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ActionButton, TableActions } from '@/components/data-display/TableActions'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

interface ColumnHandlers {
  onEdit: (group: CriterionGroup) => void
  onAddCriterion: (group: CriterionGroup) => void
  onBatchAddCriteria?: (group: CriterionGroup) => void
  onViewCriteria: (group: CriterionGroup) => void
}

export function useGroupTableColumns({
  onEdit,
  onAddCriterion,
  onBatchAddCriteria,
  onViewCriteria,
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
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => <Typography.Text code strong>{code}</Typography.Text>,
    },
    {
      title: 'Tên nhóm tiêu chí',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (name: string, g: CriterionGroup) => (
        <Tooltip title="Xem chi tiết nhóm và danh sách các tiêu chí con">
          <Typography.Link
            onClick={() => onViewCriteria(g)}
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: g.active ? 'none' : 'line-through',
            }}
          >
            <FolderOpenOutlined style={{ fontSize: 16, color: 'var(--app-text-secondary)' }} />
            <span>{name}</span>
          </Typography.Link>
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
      title: 'Số tiêu chí con',
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
      width: 120,
      render: (a: boolean) => <StatusBadge status={a ? 'active' : 'inactive'} meta={ACTIVE_META} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, g: CriterionGroup) => (
        <TableActions
          recordName={g.name}
          onView={() => onViewCriteria(g)}
          viewLabel="Xem chi tiết nhóm"
          onAdd={() => onAddCriterion(g)}
          addLabel="Thêm 1 tiêu chí con"
          addAccess={PERMISSIONS.CRITERIA.MANAGE}
          onEdit={() => onEdit(g)}
          editLabel="Sửa thông tin nhóm"
          editAccess={PERMISSIONS.CRITERIA.MANAGE}
          extra={
            onBatchAddCriteria && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <ActionButton
                  tone="add"
                  icon={<AppstoreAddOutlined />}
                  tooltip="Thêm nhanh nhiều tiêu chí con"
                  ariaLabel={`Thêm nhanh nhiều tiêu chí vào ${g.name}`}
                  onClick={() => onBatchAddCriteria(g)}
                />
              </ProtectedAction>
            )
          }
        />
      ),
    },
  ]
}
