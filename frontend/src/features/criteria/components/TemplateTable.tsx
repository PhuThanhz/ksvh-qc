import { Flex, Tag, Typography } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { TableActions } from '@/components/data-display/TableActions'
import type { Template } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

interface TemplateTableProps extends Omit<DataTableProps<Template>, 'columns' | 'rowKey'> {
  onView: (t: Template) => void
  onEdit: (t: Template) => void
  onDelete: (t: Template) => void
}

export function TemplateTable({ onView, onEdit, onDelete, ...props }: TemplateTableProps) {
  return (
    <DataTable<Template>
      {...props}
      rowKey="id"
      scroll={{ x: 1600 }}
      columns={[
        {
          title: '#',
          key: 'index',
          width: 56,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        {
          title: 'Mã mẫu',
          dataIndex: 'code',
          key: 'code',
          sorter: true,
          width: 130,
          render: (code: string, t: Template) => (
            <Tag className="code-tag--blue" onClick={() => onView(t)}>
              {code}
            </Tag>
          ),
        },
        {
          title: 'Tên mẫu phiếu kiểm tra',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
          width: 240,
          render: (name: string, t: Template) => (
            <Flex vertical>
              <span className="cell-title-link" onClick={() => onView(t)}>
                {name}
              </span>
              {t.description && <Typography.Text type="secondary" ellipsis={{ tooltip: t.description }}>{t.description}</Typography.Text>}
            </Flex>
          ),
        },
        {
          title: 'Công ty áp dụng',
          dataIndex: 'companyName',
          key: 'companyName',
          width: 190,
          render: (companyName: string | null | undefined) =>
            companyName ? (
              <Tag>{companyName}</Tag>
            ) : (
              <Tag color="default">Dùng chung toàn hệ thống</Tag>
            ),
        },
        {
          title: 'Số lượng tiêu chí',
          dataIndex: 'criterionCount',
          align: 'center',
          width: 130,
          render: (cnt: number) => <Tag color={cnt > 0 ? 'cyan' : 'default'} style={{ fontWeight: 500 }}>{cnt} tiêu chí</Tag>,
        },
        {
          title: 'Trạng thái',
          dataIndex: 'active',
          width: 160,
          render: (a: boolean) => <StatusBadge status={a ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        },
        { title: 'Cập nhật', dataIndex: 'updatedAt', width: 160, render: formatDateTime },
        {
          title: 'Thao tác',
          key: 'actions',
          width: actionColumnWidth(3),
          // Ghim mép phải bằng CSS sticky (.col-actions), không làm đổi bố cục các cột khác.
      className: 'col-actions',
          align: 'center' as const,
          render: (_: unknown, t: Template) => (
            <TableActions
              onView={() => onView(t)}
              onEdit={() => onEdit(t)}
              editAccess={PERMISSIONS.CRITERIA.MANAGE}
              onDelete={() => onDelete(t)}
              deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
              recordName={t.name}
            />
          ),
        },
      ]}
    />
  )
}

