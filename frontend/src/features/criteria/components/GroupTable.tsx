import { EditOutlined, EyeOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Badge, Button, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
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
  onViewCriteria: (group: CriterionGroup) => void
}

export function GroupTable({ groups, loading, onEdit, onAddCriterion, onViewCriteria }: GroupTableProps) {
  return (
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
            <Tooltip title="Nhấp để xem chi tiết nhóm và các tiêu chí con">
              <Typography.Link
                onClick={() => onViewCriteria(g)}
                style={{
                  fontWeight: g.active ? 600 : 400,
                  textDecoration: g.active ? 'none' : 'line-through',
                }}
              >
                {name}
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
              <Tag color="blue">{companyName}</Tag>
            ) : (
              <Tag color="default">Dùng chung toàn hệ thống</Tag>
            ),
        },
        {
          title: 'Số tiêu chí con',
          dataIndex: 'criterionCount',
          key: 'criterionCount',
          width: 180,
          render: (count: number, g: CriterionGroup) => (
            <Space>
              <Badge count={count} showZero color="blue" />
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewCriteria(g)}
              >
                Xem tiêu chí con
              </Button>
            </Space>
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
          width: 140,
          fixed: 'right',
          render: (_: unknown, g: CriterionGroup) => (
            <Space size={4}>
              <Tooltip title="Xem chi tiết nhóm & tiêu chí con">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  aria-label={`Xem chi tiết nhóm ${g.name}`}
                  onClick={() => onViewCriteria(g)}
                />
              </Tooltip>
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <Tooltip title="Thêm tiêu chí con vào nhóm này">
                  <Button
                    type="text"
                    icon={<PlusCircleOutlined />}
                    aria-label={`Thêm tiêu chí con vào nhóm ${g.name}`}
                    onClick={() => onAddCriterion(g)}
                  />
                </Tooltip>
              </ProtectedAction>
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <Tooltip title="Sửa thông tin nhóm">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label={`Sửa nhóm ${g.name}`}
                    onClick={() => onEdit(g)}
                  />
                </Tooltip>
              </ProtectedAction>
            </Space>
          ),
        },
      ]}
    />
  )
}
