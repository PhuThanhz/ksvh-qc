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
      scroll={{ x: 870 }}
      columns={[
        {
          title: '#',
          key: 'index',
          width: 60,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        { title: 'Mã', dataIndex: 'code', key: 'code', sorter: true, width: 120 },
        { title: 'Tên công ty', dataIndex: 'name', key: 'name', sorter: true, width: 250 },
        { title: 'Trạng thái', dataIndex: 'active', width: 130, render: (active: boolean) => <ActiveBadge active={active} /> },
        { title: 'Cập nhật', dataIndex: 'updatedAt', width: 170, render: formatDateTime },
        {
          title: 'Thao tác',
          key: 'actions',
          width: 140,
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
