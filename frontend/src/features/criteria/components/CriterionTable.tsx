import { Flex, Space, Tag, Tooltip, Typography } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { TableActions } from '@/components/data-display/TableActions'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

type Props = Omit<DataTableProps<Criterion>, 'columns' | 'rowKey'> & {
  onView: (c: Criterion) => void
  onEdit: (c: Criterion) => void
  onDelete: (c: Criterion) => void
  onFilterGroup?: (groupId: number) => void
  onFilterTemplate?: (templateId: number) => void
}

export function CriterionTable({ onView, onEdit, onDelete, onFilterGroup, onFilterTemplate, ...props }: Props) {
  return (
    <DataTable<Criterion>
      {...props}
      rowKey="id"
      scroll={{ x: 1000 }}
      columns={[
        {
          title: '#',
          key: 'index',
          width: 56,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        { title: 'Mã', dataIndex: 'code', key: 'code', sorter: true, width: 110 },
        {
          title: 'Nhóm tiêu chí',
          dataIndex: 'groupName',
          key: 'groupName',
          sorter: true,
          width: 170,
          render: (groupName: string, c: Criterion) => (
            <Tooltip title={onFilterGroup ? `Nhấp để lọc nhóm: ${groupName}` : undefined}>
              <Tag
                style={{ cursor: onFilterGroup ? 'pointer' : 'default', fontWeight: 500 }}
                onClick={onFilterGroup ? () => onFilterGroup(c.groupId) : undefined}
              >
                {groupName}
              </Tag>
            </Tooltip>
          ),
        },
        {
          title: 'Tiêu chí',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
          width: 260,
          render: (name: string, c: Criterion) => (
            <Flex vertical style={{ maxWidth: 360 }}>
              <Typography.Link onClick={() => onView(c)} style={{ fontWeight: 500 }}>
                {name}
              </Typography.Link>
              {c.checkMethod && (
                <Typography.Text type="secondary" ellipsis={{ tooltip: c.checkMethod }}>
                  {c.checkMethod}
                </Typography.Text>
              )}
            </Flex>
          ),
        },
        {
          title: 'Mẫu phiếu áp dụng',
          dataIndex: 'templates',
          key: 'templates',
          render: (templates: Criterion['templates']) => {
            if (!templates || templates.length === 0) {
              return <Tag color="default">Chưa gán mẫu</Tag>
            }
            return (
              <Space size={4} wrap style={{ maxWidth: 220 }}>
                {templates.map((t) => (
                  <Tooltip key={t.id} title={`Nhấp để lọc mẫu: ${t.name}`}>
                    <Tag
                      style={{ cursor: onFilterTemplate ? 'pointer' : 'default' }}
                      onClick={onFilterTemplate ? () => onFilterTemplate(t.id) : undefined}
                    >
                      {t.code}
                    </Tag>
                  </Tooltip>
                ))}
              </Space>
            )
          },
        },
        { title: 'Ảnh hưởng', dataIndex: 'baseImpact', key: 'baseImpact', sorter: true, width: 110, render: (v: number) => <ImpactTag value={v} /> },
        {
          title: 'Trạng thái',
          dataIndex: 'active',
          width: 110,
          render: (a: boolean) => <StatusBadge status={a ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        },
        {
          title: 'Thao tác',
          key: 'actions',
          width: 140,
          fixed: 'right',
          render: (_: unknown, c: Criterion) => (
            <TableActions
              onView={() => onView(c)}
              onEdit={() => onEdit(c)}
              editAccess={PERMISSIONS.CRITERIA.MANAGE}
              onDelete={() => onDelete(c)}
              deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
              recordName={c.name}
            />
          ),
        },
      ]}
    />
  )
}
