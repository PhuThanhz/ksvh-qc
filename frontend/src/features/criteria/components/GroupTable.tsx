import {
  AppstoreAddOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  PlusCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Space, Table, Tag, Tooltip, Typography } from 'antd'
import { EmptyState } from '@/components/data-display/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { TableCard } from '@/components/data-display/TableCard'
import { LoadingState } from '@/components/feedback/LoadingState'
import { GroupMobileCard } from '@/features/criteria/components/GroupMobileCard'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { useIsMobile } from '@/hooks/useIsMobile'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

export interface GroupTableProps {
  groups: readonly CriterionGroup[] | undefined
  loading: boolean
  onEdit: (group: CriterionGroup) => void
  onAddCriterion: (group: CriterionGroup) => void
  onBatchAddCriteria?: (group: CriterionGroup) => void
  onViewCriteria: (group: CriterionGroup) => void
}

export function GroupTable({
  groups,
  loading,
  onEdit,
  onAddCriterion,
  onBatchAddCriteria,
  onViewCriteria,
}: GroupTableProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <TableCard>
        {loading && !groups?.length ? (
          <LoadingState />
        ) : !groups?.length ? (
          <EmptyState description="Chưa có nhóm tiêu chí nào" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
            {groups.map((g, idx) => (
              <GroupMobileCard
                key={g.id}
                group={g}
                index={idx}
                onEdit={onEdit}
                onAddCriterion={onAddCriterion}
                onBatchAddCriteria={onBatchAddCriteria}
                onViewCriteria={onViewCriteria}
              />
            ))}
          </div>
        )}
      </TableCard>
    )
  }

  return (
    <TableCard>
      <Table<CriterionGroup>
        rowKey="id"
        loading={loading}
        dataSource={groups as CriterionGroup[]}
        pagination={false}
        scroll={{ x: 960 }}
        onRow={(record) => ({
          onDoubleClick: () => onViewCriteria(record),
          style: { cursor: 'pointer' },
        })}
        columns={[
          {
            title: '#',
            key: 'index',
            width: 50,
            align: 'center',
            render: (_: unknown, __: unknown, index: number) => index + 1,
          },
          {
            title: 'Mã nhóm',
            dataIndex: 'code',
            key: 'code',
            width: 140,
            render: (code: string) => (
              <Typography.Text code strong style={{ whiteSpace: 'nowrap' }}>
                {code}
              </Typography.Text>
            ),
          },
          {
            title: 'Tên nhóm tiêu chí',
            dataIndex: 'name',
            key: 'name',
            minWidth: 260,
            render: (name: string, g: CriterionGroup) => (
              <Tooltip title="Nhấp vào để xem chi tiết nhóm và danh sách các tiêu chí con">
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
            render: (companyName: string | null | undefined) =>
              companyName ? (
                <Tag>{companyName}</Tag>
              ) : (
                <Tag color="default">Dùng chung toàn hệ thống</Tag>
              ),
          },
          {
            title: 'Số tiêu chí con',
            dataIndex: 'criterionCount',
            key: 'criterionCount',
            width: 150,
            render: (count: number, g: CriterionGroup) => (
              <Tooltip title={`Nhóm này có ${count} tiêu chí con. Nhấp để xem chi tiết.`}>
                <Tag
                  onClick={() => onViewCriteria(g)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: count > 0 ? 'var(--app-text)' : 'var(--app-text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{count} tiêu chí</span>
                  <RightOutlined style={{ fontSize: 9, opacity: 0.7 }} />
                </Tag>
              </Tooltip>
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
            width: 170,
            fixed: 'right',
            render: (_: unknown, g: CriterionGroup) => (
              <Space size={6}>
                <Tooltip title="Xem chi tiết nhóm & tiêu chí con">
                  <button
                    type="button"
                    className="action-btn action-btn-view"
                    aria-label={`Xem chi tiết nhóm ${g.name}`}
                    onClick={() => onViewCriteria(g)}
                  >
                    <EyeOutlined />
                  </button>
                </Tooltip>
                <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                  <Tooltip title="Thêm 1 tiêu chí con">
                    <button
                      type="button"
                      className="action-btn action-btn-add"
                      aria-label={`Thêm tiêu chí con vào nhóm ${g.name}`}
                      onClick={() => onAddCriterion(g)}
                    >
                      <PlusCircleOutlined />
                    </button>
                  </Tooltip>
                </ProtectedAction>
                {onBatchAddCriteria && (
                  <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                    <Tooltip title="Thêm nhanh nhiều tiêu chí con">
                      <button
                        type="button"
                        className="action-btn action-btn-add"
                        aria-label={`Thêm nhanh nhiều tiêu chí vào nhóm ${g.name}`}
                        onClick={() => onBatchAddCriteria(g)}
                      >
                        <AppstoreAddOutlined />
                      </button>
                    </Tooltip>
                  </ProtectedAction>
                )}
                <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                  <Tooltip title="Sửa thông tin nhóm">
                    <button
                      type="button"
                      className="action-btn action-btn-edit"
                      aria-label={`Sửa nhóm ${g.name}`}
                      onClick={() => onEdit(g)}
                    >
                      <EditOutlined />
                    </button>
                  </Tooltip>
                </ProtectedAction>
              </Space>
            ),
          },
        ]}
      />
    </TableCard>
  )
}
