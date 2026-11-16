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
      columns={[
        {
          title: '#',
          key: 'index',
          width: 60,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) => index + 1,
        },
        { title: 'Mã nhóm', dataIndex: 'code', key: 'code', width: 140 },
        {
          title: 'Tên nhóm tiêu chí',
          dataIndex: 'name',
          key: 'name',
          render: (name: string, g: CriterionGroup) => (
            <Typography.Text strong={g.active} delete={!g.active}>
              {name}
            </Typography.Text>
          ),
        },
        {
          title: 'Công ty áp dụng',
          dataIndex: 'companyName',
          key: 'companyName',
          width: 170,
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
          width: 160,
          render: (count: number, g: CriterionGroup) => (
            <Space>
              <Badge count={count} showZero color="blue" />
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewCriteria(g)}
              >
                Xem tiêu chí
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
          width: 160,
          fixed: 'right',
          render: (_: unknown, g: CriterionGroup) => (
            <Space size={4}>
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
