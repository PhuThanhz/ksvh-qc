import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { TableActions } from '@/components/data-display/TableActions'
import { ActiveBadge } from '@/features/organizations/components/ActiveBadge'
import type { Company } from '@/features/organizations/organizations.types'
import { PERMISSIONS } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'

type CompanyTableProps = Omit<DataTableProps<Company>, 'columns' | 'rowKey'> & {
  onView: (company: Company) => void
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
}

export function CompanyTable({ onView, onEdit, onDelete, ...props }: CompanyTableProps) {
  return (
    <DataTable<Company>
      {...props}
      rowKey="id"
      columns={[
        {
          title: '#',
          key: 'index',
          width: 60,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        { title: 'Mã', dataIndex: 'code', key: 'code', sorter: true },
        { title: 'Tên công ty', dataIndex: 'name', key: 'name', sorter: true },
        { title: 'Trạng thái', dataIndex: 'active', render: (active: boolean) => <ActiveBadge active={active} /> },
        { title: 'Cập nhật', dataIndex: 'updatedAt', render: formatDateTime },
        {
          title: 'Thao tác',
          key: 'actions',
          width: 120,
          fixed: 'right',
          render: (_: unknown, row: Company) => (
            <TableActions
              onView={() => onView(row)}
              onEdit={() => onEdit(row)}
              editAccess={PERMISSIONS.ORGANIZATION.MANAGE}
              onDelete={() => onDelete(row)}
              deleteAccess={PERMISSIONS.ORGANIZATION.MANAGE}
              recordName={row.name}
            />
          ),
        },
      ]}
    />
  )
}
