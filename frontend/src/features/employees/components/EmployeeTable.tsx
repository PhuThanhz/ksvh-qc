import { Flex, Tag, Typography } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'
import { TableActions } from '@/components/data-display/TableActions'
import type { Employee } from '@/features/employees/employees.types'
import { PERMISSIONS } from '@/permissions'

type ActiveKey = 'active' | 'inactive'
const ACTIVE_META: Record<ActiveKey, { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang làm việc', tone: 'success' },
  inactive: { label: 'Nghỉ việc', tone: 'default' },
}

type EmployeeTableProps = Omit<DataTableProps<Employee>, 'columns' | 'rowKey'> & {
  onView: (e: Employee) => void
  onEdit: (e: Employee) => void
  onDelete: (e: Employee) => void
}

const dash = (v: string | null) => v ?? '—'

export function EmployeeTable({ onView, onEdit, onDelete, ...props }: EmployeeTableProps) {
  return (
    <DataTable<Employee>
      {...props}
      rowKey="id"
      scroll={{ x: 800 }}
      columns={[
        {
          title: '#',
          key: 'index',
          width: 56,
          align: 'center',
          render: (_: unknown, __: unknown, index: number) =>
            ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
        },
        { title: 'Mã NV', dataIndex: 'employeeCode', key: 'employeeCode', sorter: true, width: 110 },
        {
          title: 'Họ tên',
          dataIndex: 'fullName',
          key: 'fullName',
          sorter: true,
          minWidth: 160,
          render: (name: string, e: Employee) => (
            <Flex vertical>
              <span>{name}</span>
              {e.jobTitle && <Typography.Text type="secondary">{e.jobTitle}</Typography.Text>}
            </Flex>
          ),
        },
        { title: 'Nhà hàng / phòng ban', dataIndex: 'orgUnitName', minWidth: 160, render: dash },
        {
          title: 'Liên hệ',
          key: 'contact',
          render: (_: unknown, e: Employee) => (
            <Flex vertical>
              <span>{dash(e.phone)}</span>
              {e.email && <Typography.Text type="secondary">{e.email}</Typography.Text>}
            </Flex>
          ),
        },
        {
          title: 'Tài khoản',
          dataIndex: 'username',
          render: (u: string | null) => (u ? <Tag>{u}</Tag> : <Typography.Text type="secondary">Chưa có</Typography.Text>),
        },
        {
          title: 'Trạng thái',
          dataIndex: 'active',
          render: (active: boolean) => <StatusBadge status={active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        },
        {
          title: 'Thao tác',
          key: 'actions',
          width: 140,
          fixed: 'right',
          render: (_: unknown, e: Employee) => (
            <TableActions
              onView={() => onView(e)}
              onEdit={() => onEdit(e)}
              editAccess={PERMISSIONS.EMPLOYEE.MANAGE}
              onDelete={() => onDelete(e)}
              deleteAccess={PERMISSIONS.EMPLOYEE.MANAGE}
              recordName={e.fullName}
            />
          ),
        },
      ]}
    />
  )
}
